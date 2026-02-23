library(DBI)
library(RSQLite)
library(jsonlite)
library(dplyr)
library(tidyr)
library(rstudioapi)
library(tidyverse)

print("Hello")
# ── Connect to the cache database ──────────────────────────────────────────────
db_path <- "server/cache.db"

cat("Connecting to:", db_path, "\n")
con <- dbConnect(SQLite(), db_path)

# ── List all tables ────────────────────────────────────────────────────────────
cat("\n=== Tables ===\n")
tables <- dbListTables(con)
print(tables)

# ── Queries table ──────────────────────────────────────────────────────────────
queries <- dbGetQuery(con, "
  SELECT q.*, COUNT(r.id) AS result_count
  FROM queries q
  LEFT JOIN results r ON r.query_id = q.id
  GROUP BY q.id
  ORDER BY q.created_at DESC
")

cat("\n=== Cached Queries ===\n")
cat("Total queries:", nrow(queries), "\n\n")

queries_display <- queries %>%
  mutate(
    route = paste(origin, "->", destination),
    cached_at = format(as.POSIXct(created_at, tz = "UTC"), "%Y-%m-%d %H:%M")
  ) %>%
  select(id, route, departure_date, return_date, adults, currency, result_count, cached_at, route_search_id)

head(queries_display)

# ── Results table ──────────────────────────────────────────────────────────────
results <- dbGetQuery(con, "
  SELECT r.*, q.origin AS q_origin, q.destination AS q_dest,
         q.departure_date, q.return_date, q.created_at AS cached_at
  FROM results r
  JOIN queries q ON q.id = r.query_id
  ORDER BY q.created_at DESC, r.total_price ASC
")

cat("\n=== All Results ===\n")
cat("Total result rows:", nrow(results), "\n\n")

# ── Summary by route ──────────────────────────────────────────────────────────
if (nrow(results) > 0) {
  route_summary <- results %>%
    mutate(route = paste(origin, "->", destination)) %>%
    group_by(route) %>%
    summarise(
      n_results = n(),
      min_price = min(total_price),
      max_price = max(total_price),
      median_price = median(total_price),
      n_direct = sum(stops == 0),
      n_1stop = sum(stops == 1),
      n_2plus = sum(stops >= 2),
      airlines = paste(sort(unique(airline_code)), collapse = ", "),
      .groups = "drop"
    ) %>%
    arrange(route)

  cat("\n=== Route Summary ===\n")
  print(route_summary, n = 50, width = 200)

  # ── Price distribution by stops ────────────────────────────────────────────
  price_by_stops <- results %>%
    mutate(route = paste(origin, "->", destination)) %>%
    group_by(route, stops) %>%
    summarise(
      n = n(),
      min_price = min(total_price),
      median_price = median(total_price),
      max_price = max(total_price),
      .groups = "drop"
    ) %>%
    arrange(route, stops)

  cat("\n=== Price by Stop Count ===\n")
  print(price_by_stops, n = 100)

  # ── Airline breakdown ──────────────────────────────────────────────────────
  airline_summary <- results %>%
    mutate(route = paste(origin, "->", destination)) %>%
    group_by(route, airline_code, airline_name) %>%
    summarise(
      n_flights = n(),
      min_price = min(total_price),
      median_price = median(total_price),
      n_direct = sum(stops == 0),
      .groups = "drop"
    ) %>%
    arrange(route, min_price)

  cat("\n=== Airline Breakdown ===\n")
  print(airline_summary, n = 100, width = 200)
}

# ── Inspect segments for a specific query ────────────────────────────────────
# Change query_id to inspect a different cached search
inspect_segments <- function(query_id) {
  q <- dbGetQuery(con, "SELECT * FROM queries WHERE id = ?", params = list(query_id))
  if (nrow(q) == 0) {
    cat("Query", query_id, "not found\n")
    return(invisible(NULL))
  }

  cat("\n=== Segments for Query", query_id, "===\n")
  cat("Route:", q$origin, "->", q$destination, "\n")
  cat("Date:", q$departure_date, "\n")
  cat("Cached:", q$created_at, "\n\n")

  rows <- dbGetQuery(con, "
    SELECT offer_id, airline_code, airline_name, flight_number,
           origin, destination, departure_at, arrival_at,
           duration, stops, stop_codes, total_price, currency,
           segments_json, return_segments_json
    FROM results WHERE query_id = ?
    ORDER BY total_price ASC
  ", params = list(query_id))

  cat("Results:", nrow(rows), "\n\n")

  for (i in seq_len(nrow(rows))) {
    r <- rows[i, ]
    cat(sprintf("#%d  %s %s  %s->%s  $%.0f %s  stops=%d\n",
                i, r$airline_code, r$flight_number,
                r$origin, r$destination,
                r$total_price, r$currency, r$stops))

    if (!is.na(r$segments_json) && nchar(r$segments_json) > 2) {
      segs <- fromJSON(r$segments_json)
      for (j in seq_len(nrow(segs))) {
        s <- segs[j, ]
        op_info <- ""
        if (!is.null(s$operatingCarrierCode) && !is.na(s$operatingCarrierCode)) {
          op_info <- sprintf(" (op. by %s %s)", s$operatingCarrierCode, s$operatingCarrierName)
        }
        cat(sprintf("    Seg %d: %s  %s->%s  dep %s  arr %s  %s%s\n",
                    j, s$flightNumber, s$origin, s$destination,
                    s$departureAt, s$arrivalAt, s$duration, op_info))
      }
    }
    cat("\n")
  }
}

# ── Helper: browse results for a specific route & date ───────────────────────
browse_route <- function(origin_code, dest_code, dep_date = NULL) {
  query <- "
    SELECT r.*, q.departure_date, q.created_at AS cached_at
    FROM results r
    JOIN queries q ON q.id = r.query_id
    WHERE UPPER(q.origin) = UPPER(?) AND UPPER(q.destination) = UPPER(?)
  "
  params <- list(origin_code, dest_code)

  if (!is.null(dep_date)) {
    query <- paste(query, "AND q.departure_date = ?")
    params <- c(params, list(dep_date))
  }

  query <- paste(query, "ORDER BY r.total_price ASC")
  rows <- dbGetQuery(con, query, params = params)

  if (nrow(rows) == 0) {
    cat("No cached results for", origin_code, "->", dest_code, "\n")
    return(invisible(NULL))
  }

  cat(sprintf("\n=== %s -> %s  (%d results) ===\n\n", origin_code, dest_code, nrow(rows)))

  display <- rows %>%
    select(offer_id, airline_code, flight_number, origin, destination,
           departure_at, arrival_at, duration, stops, stop_codes,
           total_price, currency) %>%
    mutate(
      dep_time = format(as.POSIXct(departure_at), "%H:%M"),
      arr_time = format(as.POSIXct(arrival_at), "%H:%M")
    )

  print(display, n = 200, width = 200)
  invisible(rows)
}

# ── Usage examples (uncomment to run) ────────────────────────────────────────

# Browse all results for a route:
# browse_route("BNE", "NRT")
# browse_route("BNE", "NRT", "2026-03-25")

# Inspect segments for a specific query ID:
# inspect_segments(1)

# ── Interactive: show first query's segments if data exists ──────────────────
if (nrow(queries) > 0) {
  cat("\n── To inspect segments, run: inspect_segments(", queries$id[1], ") ──\n")
  cat("── To browse a route, run: browse_route(\"BNE\", \"NRT\") ──\n")
}

# ── Clean up ─────────────────────────────────────────────────────────────────
# dbDisconnect(con)  # Uncomment when done, or leave open for interactive use
