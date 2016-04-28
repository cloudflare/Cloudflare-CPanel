import { notificationAddClientAPIError } from './notifications';
import * as ActionTypes from '../constants/ActionTypes';
import { asyncDNSRecordFetchList } from './zoneDnsRecords';
import { asyncZoneFetchAnalytics } from './zoneAnalytics';
import { asyncZoneRailgunFetchAll } from './zoneRailgun';
import { asyncZoneFetchScan } from './zoneScan';
import { asyncZoneFetchSettings } from './zoneSettings';

export function zoneSetActiveZone(zone) {
    return {
        type: ActionTypes.ZONES_SET_ACTIVE_ZONE,
        zone
    }
}

export function asyncZoneSetActiveZone(zone) {
    return dispatch => {
        dispatch(zoneSetActiveZone(zone));
        if (typeof zone.id !== 'undefined') {
            //no zone id means domain isn't on cloudflare.
            if(zone.status === 'active') {
                dispatch(asyncDNSRecordFetchList(zone.id));
                dispatch(asyncZoneRailgunFetchAll(zone.id));
            }
            dispatch(asyncZoneFetchSettings(zone.id));
            dispatch(asyncZoneFetchAnalytics(zone.id));
            dispatch(asyncZoneFetchScan(zone.id));
        }
    }
}

export function zoneSetActiveZoneIfEmpty(zone) {
    return (dispatch, getState) => {
        if(getState().activeZone.name === "") {
            dispatch(asyncZoneSetActiveZone(zone));
        }
    }
}