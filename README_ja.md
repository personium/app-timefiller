# app-timefiller-wakaba
Sharing hub application

## アプリ配備
タイムフィリングアプリをアプリセルに配備する為の手順を説明します。アカウント名やロール名などは必ずしも説明通りにする必要はありません。変更した場合は変更後の名前に置き換えてください。

1. アプリセルを準備してください。アプリセルの作成についてはcell-creatorやunit-managerを使用して下さい。

1. アプリセルに次のRoleを作成して下さい。  
 ・syncAccToken  
 ・syncTarget  
 ・writeOData  
 ・admin  
![Role Create](doc/role_create.png)

1. アプリセルに次のアカウントを作成して下さい。  
 ・tokenAcc  
 ・adminUser  
![Account Create](doc/account_create.png)

1. 作成したアカウントに次のRoleを付与して下さい。  
 ・tokenAcc:syncAccToken  
 ・adminUser:admin  
![Assign Role Account](doc/assign_role_account_1.png)
![Assign Role Account](doc/assign_role_account_2.png)

1. 作成したRoleに次の権限を付与して下さい。  
 ・syncAccToken:auth-read,social-read  
 ・admin:root  
![Role ACL](doc/role_acl.png) 

1. アプリセルのmain配下にソースを配備して下さい。  
![Deploy HTML](doc/deploy_html.png)

1. アプリセルのmain配下にMyDataを配備します。
![Deploy MyData](doc/deploy_MyData.png)

1. 以下のEngineサービスを作成して下さい。  
 ・deleteEventList  
 ・getAppAuthToken  
 ・getEvent  
 ・getPCalendarSchedule  
 ・receive_redirect  
 ・syncEventList  
 ・start_oauth2  
 ・createOData  
![Create EngineService](doc/create_engineservice.png)

1. MyDataにACLを設定して下さい。  
 ・syncAccToken:read,write  
![MyData ACL](doc/mydata_acl.png)

1. launch.jsonにACLを設定して下さい。  
 ・all:read  
![Launch ACL](doc/launch_acl.png) 

1. __/html/Engine/src/acc_info.jsのappCellUrlにアプリセルURLとappUserIdにtokenAccを設定して下さい。  
   appUserPassには作成時に登録したパスワードを設定して下さい。  
   PersoniumCalendarと連携する場合、PersoniumCalendarのアカウントをcoopUserIdに設定して下さい。
![acc_info](doc/acc_info.png)

1. __/html/Engine/src/createOData.jsのcellUrlにアプリセルURLとcellAccにadminUserを設定して下さい。  
![createOData](doc/createOData.png)

1. __/html/EngineにACLを設定して下さい。  
 ・all:exec
![Engine_ACL](doc/engine_acl.png)

1. createODataを実行し、ODataを作成して下さい。  
例ではRestlet Clientを使っています。  
![Exec_createOData](doc/exec_createodata.png)

1. 作成したODataにACLを設定して下さい。  
 ・all:read
 ・writeOData:read,write
![OData_ACL](doc/odata_acl.png)

1. __/html配下のEngine以外のファイルにACLを設定して下さい。  
 ・all:read
![HTML_ACL](doc/html_acl.png)
![COLLECTION_ACL](doc/collection_acl.png)

## EventList同期用のRule作成
1. 条件を以下の用に設定して下さい。  
 ・Name: syncEventList  
 ・Box: [main]  
 ・Action: exec  
 ・EventType: timer.periodic  
 ・EventObject: 5  
 ・TargetUrl: personium-localcell:/__/html/Engine/syncEventList  
![Rule_Create](doc/rule_create.png)

## EventListの同期対象を追加する
1. 外部セルに同期対象のCellUrlを登録して下さい。
![ExtCell_Create](doc/extcell_create.png)

1. 登録した外部セルにロールを付与して下さい。  
 ・syncTarget　　
![Assign_ExtCell_Role](doc/assign_extcell_role.png)