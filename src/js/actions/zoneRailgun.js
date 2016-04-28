import { zoneRailgunGetAll, zoneRailgunPatch, v4ResponseOk } from '../utils/CFClientV4API/CFClientV4API';
import { notificationAddClientAPIError, notificationAddSuccess } from './notifications';
import * as ActionTypes from '../constants/ActionTypes';

export function zoneRailgunFetchAll() {
    return {
        type: ActionTypes.ZONE_RAILGUNS_FETCH_ALL
    }
}

export function zoneRailgunFetchAllSuccess(zoneId, zoneRailguns) {
    return {
        type: ActionTypes.ZONE_RAILGUNS_FETCH_ALL_SUCCESS,
        zoneId,
        zoneRailguns
    }
}

export function zoneRailgunFetchAllError() {
    return {
        type: ActionTypes.ZONE_RAILGUNS_FETCH_ALL_ERROR
    }
}

export function asyncZoneRailgunFetchAll(zoneId) {
    return dispatch => {
        dispatch(zoneRailgunFetchAll());
        zoneRailgunGetAll(zoneId, function(response) {
            if(v4ResponseOk(response)) {
                dispatch(zoneRailgunFetchAllSuccess(zoneId, response.body.result));
            } else {
                dispatch(notificationAddClientAPIError(zoneRailgunFetchAllError(), response));
            }
        },
        function(error){
            dispatch(notificationAddClientAPIError(zoneRailgunFetchAllError(), error));
        });
    }
}

export function zoneRailgunConnectionUpdate(zoneId, zoneRailgun) {
    return {
        type: ActionTypes.ZONE_RAILGUNS_CONNECTION_UPDATE,
        zoneId,
        zoneRailgun
    }
}

export function zoneRailgunConnectionUpdateSuccess(zoneId, zoneRailgun) {
    return {
        type: ActionTypes.ZONE_RAILGUNS_CONNECTION_UPDATE_SUCCESSS,
        zoneId,
        zoneRailgun
    }
}

export function zoneRailgunConnectionUpdateError(zoneId, zoneRailgun) {
    return {
        type: ActionTypes.ZONE_RAILGUNS_CONNECTION_UPDATE_ERROR,
        zoneId,
        zoneRailgun
    }
}

export function asyncZoneRailgunConnectionUpdate(zoneId, railgun, isConnected) {
    return dispatch => {
        let oldRailgun = Object.assign({}, railgun);
        dispatch(zoneRailgunConnectionUpdate(zoneId, Object.assign({}, railgun, { connected: isConnected })));
        zoneRailgunPatch(zoneId, railgun.id, isConnected, function(response) {
            if(v4ResponseOk(response)) {
                dispatch(zoneRailgunConnectionUpdateSuccess(zoneId, response.body.result));
            } else {
                dispatch(notificationAddClientAPIError(zoneRailgunConnectionUpdateError(zoneId, oldRailgun), response));
            }
        },
        function(error) {
            dispatch(notificationAddClientAPIError(zoneRailgunConnectionUpdateError(zoneId, oldRailgun), error));
        });
    }
}

