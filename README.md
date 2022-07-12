# app-timefiller-wakaba
A sample Personium App that uses app-personium-calendar data and recommend activities for users' free time based on their personal preference.


## App deployment
We will explain the procedure for deploying the time filling app to the app cell. Account names and role names do not have to be exactly as described. If you change it, please replace it with the changed name.

1. Please prepare app cell. Please use cell-creator or unit-manager for creating app cell.

1. Create the following Role in the app cell.  
 ・syncAccToken  
 ・syncTarget  
 ・writeOData  
 ・admin  
![Role Create](doc/role_create.png)

1. Please create the following account in the appcell.  
 ・tokenAcc  
 ・adminUser  
![Account Create](doc/account_create.png)

1. Please grant the following Role to the created account.  
 ・tokenAcc:syncAccToken  
 ・adminUser:admin  
![Assign Role Account](doc/assign_role_account_1.png)
![Assign Role Account](doc/assign_role_account_2.png)

1. Please grant the following authority to the created Role.  
 ・syncAccToken:auth-read,social-read  
 ・admin:root  
![Role ACL](doc/role_acl.png) 

1. Deploy the source under appcell main.  
![Deploy HTML](doc/deploy_html.png)

1. Deploy MyData under main.　　
![Deploy MyData](doc/deploy_MyData.png)

1. Create the following engine service:  
 ・deleteEventList  
 ・getAppAuthToken  
 ・getEvent  
 ・getPCalendarSchedule  
 ・receive_redirect  
 ・syncEventList  
 ・start_oauth2  
 ・createOData  
![Create EngineService](doc/create_engineservice.png)

1. Please set ACL to MyData.  
 ・syncAccToken:read,write  
![MyData ACL](doc/mydata_acl.png)

1. Please set ACL in launch.json.  
 ・all:read  
![Launch ACL](doc/launch_acl.png) 

1. Set the app cell URL to appCellUrl in __/html/Engine/src/acc_info.js, and set tokenAcc to appUserId.  
   Please set the password registered at creation to appUserPass.  
   When linking with PersoniumCalendar, set the PersoniumCalendar account to coopUserId.
![acc_info](doc/acc_info.png)

1. Set the app cell URL to cellUrl in __/html/Engine/src/createOData.js and adminUser to cellAcc.  
![createOData](doc/createOData.png)

1. Please set ACL in __/html/Engine.  
 ・all:exec
![Engine_ACL](doc/engine_acl.png)

1. Execute createOData and create OData.  
The example uses the Restlet Client.  
![Exec_createOData](doc/exec_createodata.png)

1. Set ACL to the created OData.  
 ・all:read
 ・writeOData:read,write
![OData_ACL](doc/odata_acl.png)

1. Please set ACL in files other than Engine under __/html.  
 ・all:read
![HTML_ACL](doc/html_acl.png)
![COLLECTION_ACL](doc/collection_acl.png)

## Rule creation for EventList synchronization
1. Set the condition of the rule for the following.  
 ・Name: syncEventList  
 ・Box: [main]  
 ・Action: exec  
 ・EventType: timer.periodic  
 ・EventObject: 5  
 ・TargetUrl: personium-localcell:/__/html/Engine/syncEventList  
![Rule_Create](doc/rule_create.png)

## Add synchronization target of EventList
1. Register the CellUrl to be synchronized to the external cell.
![ExtCell_Create](doc/extcell_create.png)

1. Please grant the role to the registered external cell.  
 ・syncTarget  
![Assign_ExtCell_Role](doc/assign_extcell_role.png)
