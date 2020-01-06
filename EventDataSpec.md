# Event Data Specification

This document describes the spec of the event data used in this application. (Still under preparation)

By doing the followings, you can enrich the event data and time-filling ux .

1. Create a new event content-source cell,
1. Write an adapter program to sync the event data onto the content-source cell.
1. Configure connection from the event recommending cell to content-source cells.

|Key|Type|Description|Note|
|:--|:--|:--|:--|
|__id|String|Unique key for the record||
|address|String|Event venue address||
|postalCode|String|Postal code of Event venue||
|description|String|Event description||
|image|String|Event venue address||
|title|String|Event title||

See:  
https://github.com/personium/app-timefiller/blob/master/bar/90_contents/OData/00_%24metadata.xml
