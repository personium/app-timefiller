exports.accInfo = (function() {
    /*
     * Begin of your Personium app configurations
     */
    var appCellUrl = 'https://app-timefiller-wakaba.demo.personium.io/'; // for example: https://demo.personium.io/appCellName/ or https://appCellName.demo.personium.io/
    var appUserId = '***';
    var appUserPass = '***';

    var coopAppCellUrl = 'https://app-personium-calendar.demo.personium.io/';
    var coopUserId = '***';
    var coopUserPass = '***';

    /*
     * End of your Personium app configurations
     */

    /*
     * Don't modify anything from here on
     */
    var accInfo = {};
    accInfo.APP_CELL_URL = appCellUrl;
    accInfo.APP_CELL_ADMIN_INFO = {
        cellUrl: appCellUrl,
        userId: appUserId,
        password: appUserPass 
    };
    accInfo.COOP_APP_CELL_URL = coopAppCellUrl;
    accInfo.COOP_APP_CELL_ADMIN_INFO = {
        cellUrl: coopAppCellUrl,
        userId: coopUserId,
        password: coopUserPass
    };

    return accInfo;
}());
