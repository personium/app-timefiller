# app-timefiller-wakaba
Sharing hub application

## App deployment
We will explain the procedure for deploying the time filling app to the app cell. Account names and role names do not have to be exactly as described. If you change it, please replace it with the changed name.

1. Please prepare app cell. Please use cell-creator or unit-manager for creating app cell.

1. Create the following Role in the app cell.  
 ・syncAccToken  
 ・syncTarget  
 ・writeOData  
 ・admin  

1. Please create the following account in the appcell.  
 ・tokenAcc  
 ・adminUser  

1. Please grant the following Role to the created account.  
 ・tokenAcc:syncAccToken  
 ・adminUser:admin  

1. Please grant the following authority to the created Role.  
 ・syncAccToken:auth-read,social-read  
 ・admin:root  

1. Deploy the source under appcell main.  

1. 以下のエンジンサービスを作成します。  
 ・deleteEventList  
 ・getAppAuthToken  
 ・getEvent  
 ・getPCalendarSchedule  
 ・receive_redirect  
 ・syncEventList  
 ・start_oauth2  
 ・createOData  

1. Please set ACL to MyData.  
 ・syncAccToken:read,write  

1. Please set ACL in launch.json.  
 ・all:read  

1. Set tokenAcc to appUserId of __/html/Engine/src/acc_info.js.  
   Please set the password registered at creation to appUserPass.  
   When linking with PersoniumCalendar, set the PersoniumCalendar account to coopUserId.

1. Set adminUser to cellAcc in __/html/Engine/src/createOData.js.  

1. Please set ACL in __/html/Engine.  
 ・all:exec

1. Execute createOData and create OData.  

1. Set ACL to the created OData.  
 ・all:read
 ・writeOData:read,write

1. Please set ACL in files other than Engine under __/html.  
 ・all:read

## Rule creation for EventList synchronization
1. Set the condition of the rule for the following.  
 ・Name: syncEventList  
 ・Box: [main]  
 ・Action: exec  
 ・EventType: timer.periodic  
 ・EventObject: 5  
 ・TargetUrl: personium-localcell:/__/html/Engine/syncEventList  

## Add synchronization target of EventList
1. Register the CellUrl to be synchronized to the external cell.

1. Please grant the role to the registered external cell.  
 ・syncTarget