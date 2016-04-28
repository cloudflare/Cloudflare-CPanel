import { combineReducers } from 'redux';
import { routeReducer } from 'redux-simple-router';

import { activeZoneReducer } from './activeZone';
import { appReducer } from './app';
import { configReducer } from './config';
import { dnsRecordsReducer } from './zoneDnsRecords.js';
import { intlReducer } from './intl';
import { notificationsReducer } from './notifications';
import { userReducer } from './user';
import { zoneAnalyticsReducer } from './zoneAnalytics';
import { zonePurgeCacheReducer } from './zonePurgeCache';
import { zoneRailgunReducer } from './zoneRailgun';
import { zoneScanReducer } from './zoneScan';
import { zoneSettingsReducer } from './zoneSettings';
import { zonesReducer } from './zones';

const rootReducer = combineReducers({
    activeZone: activeZoneReducer,
    app: appReducer,
    config: configReducer,
    intl: intlReducer,
    user: userReducer,
    notifications: notificationsReducer,
    routing: routeReducer,
    zones: zonesReducer,
    zoneAnalytics: zoneAnalyticsReducer,
    zoneDnsRecords: dnsRecordsReducer,
    zonePurgeCache: zonePurgeCacheReducer,
    zoneRailguns: zoneRailgunReducer,
    zoneScan: zoneScanReducer,
    zoneSettings: zoneSettingsReducer,
});

export default rootReducer;