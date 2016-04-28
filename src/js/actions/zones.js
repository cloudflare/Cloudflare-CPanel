import {
    zoneGetAll,
    zoneDeleteZone,
    v4ResponseOk
} from '../utils/CFClientV4API/CFClientV4API';
import { partialZoneSet, hostAPIResponseOk } from '../utils/CFHostAPI/CFHostAPI';
import { notificationAddError } from './notifications';
import * as ActionTypes from '../constants/ActionTypes';
import { zoneSetActiveZoneIfEmpty } from './activeZone';
import { normalizeZoneGetAll } from '../constants/Schemas';
import { dnsRecordClearAll } from './zoneDnsRecords';

export function zoneDelete() {
    return {
        type: ActionTypes.ZONES_DELETE_ZONE
    }
}

export function zoneDeleteSuccess() {
    return {
        type: ActionTypes.ZONES_DELETE_ZONE_SUCCESS
    }
}

export function zoneDeleteError(error) {
    return {
        type: ActionTypes.ZONES_DELETE_ZONE_ERROR,
        error
    }
}

export function asyncZoneDelete(zoneId) {
    return dispatch => {
        dispatch(zoneDelete(zoneId));

        zoneDeleteZone(zoneId, function(response){
                if(v4ResponseOk(response)) {
                    dispatch(zoneDeleteSuccess())
                    dispatch(dnsRecordClearAll(zoneId));
                    //after we provision a cname refresh the zone list
                    dispatch(asyncFetchZones());
                } else {
                    dispatch(zoneDeleteError());
                    response.body.errors.forEach(function(error) {
                        dispatch(notificationAddError(error.message));
                    });
                }
            },
            function(error){
                dispatch(zoneFetchError());
                dispatch(notificationAddError(error));
            });
    }
}

export function zoneFetch() {
    return {
        type: ActionTypes.ZONES_FETCH
    }
}

export function zoneFetchSuccess(zoneList) {
    return {
        type: ActionTypes.ZONES_FETCH_SUCCESS,
        zoneList
    }
}

export function zoneFetchError(error) {
    return {
        type: ActionTypes.ZONES_FETCH_ERROR,
        error
    }
}

export function asyncFetchZones() {
        return dispatch => {
            dispatch(zoneFetch());

            zoneGetAll(function (response) {
                    if (v4ResponseOk(response)) {
                        dispatch(zoneFetchSuccess(response.body.result))
                        if(response.body.result[0]) {
                            dispatch(zoneSetActiveZoneIfEmpty(response.body.result[0]));
                        }
                    } else {
                        dispatch(zoneFetchError());
                        response.body.errors.forEach(function (error) {
                            dispatch(notificationAddError(error.message));
                        });
                    }
                },
                function (error) {
                    dispatch(zoneFetchError());
                    dispatch(notificationAddError(error));
                });
        }
}
