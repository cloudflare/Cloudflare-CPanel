import {
    zoneScanGet,
    zoneScanPut,
    v4ResponseOk
} from '../utils/CFClientV4API/CFClientV4API';
import { notificationAddClientAPIError } from './notifications';
import * as ActionTypes from '../constants/ActionTypes';

export function zoneFetchScan() {
    return {
        type: ActionTypes.ZONE_FETCH_SCAN
    }
}

export function zoneFetchScanSuccess(zoneId, zoneScan) {
    return {
        type: ActionTypes.ZONE_FETCH_SCAN_SUCCESS,
        zoneId: zoneId,
        zoneScan: zoneScan
    }
}

export function zoneFetchScanError() {
    return {
        type: ActionTypes.ZONE_FETCH_SCAN_ERROR
    }
}

export function asyncZoneFetchScan(zoneId) {
    return dispatch => {
        dispatch(zoneFetchScan());
        zoneScanGet(zoneId, function(response) {
            if(v4ResponseOk(response)) {
                dispatch(zoneFetchScanSuccess(zoneId, response.body.result));
            } else {
                dispatch(notificationAddClientAPIError(zoneFetchScanError(), response));
            }
        },
        function(error) {
            dispatch(notificationAddClientAPIError(zoneFetchScanError(), error));
        });
    }
}

export function zoneUpdateScan(zoneId, zoneScan) {
    return {
        type: ActionTypes.ZONE_UPDATE_SCAN,
        zoneId,
        zoneScan
    }
}

export function zoneUpdateScanSuccess(zoneId, zoneScan) {
    return {
        type: ActionTypes.ZONE_UPDATE_SCAN_SUCCESS,
        zoneId,
        zoneScan
    }
}

export function zoneUpdateScanError(zoneId, zoneScan) {
    return {
        type: ActionTypes.ZONE_UPDATE_SCAN_ERROR,
        zoneId,
        zoneScan
    }
}

export function asyncZoneUpdateScan(zoneId, showInterstitial) {
    return dispatch => {
        dispatch(zoneUpdateScan(zoneId, {'show_interstitial': showInterstitial}));
        zoneScanPut(zoneId, showInterstitial, function(response) {
                if(v4ResponseOk(response)) {
                    dispatch(zoneUpdateScanSuccess(zoneId, response.body.result));
                } else {
                    dispatch(notificationAddClientAPIError(zoneUpdateScanError(zoneId, {'show_interstitial': !showInterstitial}), response));
                }
            },
            function(error) {
                dispatch(notificationAddClientAPIError(zoneUpdateScanError(zoneId, {'show_interstitial': !showInterstitial}), error));
            });
    }
}