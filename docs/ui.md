
## General principles
- Switching pages should not clear any results, going to another page and back again should show the last query in there
- All data is cached for now so that the user can be combine existing queries
- Where possible auto fill in every UI field to make it easier to search with less clicks. For example dates could default to today + 1 and return to today + 8
- Auto suggest dep and arr ports with most recently searched ones, add location name next to them as you type so it is easier to see we have the right one

## Generic Result Filters

The principle is that the query should get and store all results. The user can then filter those results dynamically without searching again.
The filter UI should be shared across all tabs.
For pages with an outbound and inbound journey, the filters should be duplicated for each journey.

Filters 
- Direct, <=1 Stop, <= 2 Stop
- Duration of journey, in buckets of 4 hours from < 4 hours to < 28 hours
- Mixed carriers Y/N
- Carrier filter (should be a dynamic tickbox of carriers from results, multi-select should be enabled, there should be an easy way to select all)
- Dep time filter (between 00:00 and 24:00, a range slider is ideal)
- Arr time filter (between 00:00 and 24:00, a range slider is ideal)


Pages this applies to
- Route search (2 sets of filters)
- Time Sweep (2 sets of filters)
- Scatter Search (1 set of filter)

## Page specific filters
- Time Sweep. One additional filter that is trip length range in days. This should be from the departure date local to the return journey arrival date local. This will affect the combo page only.
