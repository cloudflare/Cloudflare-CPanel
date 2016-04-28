import * as ActionTypes from '../constants/ActionTypes';
import { zoneDNSRecordGetAll, zoneDNSRecordPostNew, zoneDNSRecordPatch, v4ResponseOk } from '../utils/CFClientV4API/CFClientV4API';
import { notificationAddClientAPIError } from './notifications';


export function dnsRecordClearAll(zoneId) {
    return {
        type: ActionTypes.DNS_RECORD_CLEAR_ALL,
        zoneId
    }
}

export function dnsRecordCreate(name) {
    return {
        type: ActionTypes.DNS_RECORD_CREATE,
        name
    }
}

export function dnsRecordCreateSuccess(zoneId, dnsRecord) {
    return {
        type: ActionTypes.DNS_RECORD_CREATE_SUCCESS,
        zoneId,
        dnsRecord
    }
}

export function dnsRecordCreateError() {
    return {
        type: ActionTypes.DNS_RECORD_CREATE_ERROR
    }
}

export function asyncDNSRecordCreate(zoneId, type, name, content) {
    return dispatch => {
        dispatch(dnsRecordCreate(name));
        zoneDNSRecordPostNew({zoneId: zoneId, type: type, name: name, content: content}, function(response) {
            if(v4ResponseOk(response)) {
                dispatch(dnsRecordCreateSuccess(zoneId, response.body.result));
                //CloudFlare defaults new records with proxied = false.
                dispatch(asyncDNSRecordUpdate(zoneId, response.body.result, true));
            } else {
                dispatch(notificationAddClientAPIError(dnsRecordCreateError(), response));
            }
        }, function(error) {
                dispatch(notificationAddClientAPIError(dnsRecordCreateError(), error));
        });
    }
}

export function dnsRecordFetchList() {
    return {
        type: ActionTypes.DNS_RECORD_FETCH_LIST
    }
}

export function dnsRecordFetchListSuccess(zoneId, dnsRecords) {
    return {
        type: ActionTypes.DNS_RECORD_FETCH_LIST_SUCCESS,
        zoneId,
        dnsRecords
    }
}

export function dnsRecordFetchListError() {
    return {
        type: ActionTypes.DNS_RECORD_FETCH_LIST_SUCCESS
    }
}

export function asyncDNSRecordFetchList(zoneId) {
    return dispatch => {
        dispatch(dnsRecordFetchList());
        zoneDNSRecordGetAll(zoneId, function(response) {
            if(v4ResponseOk(response)) {
                dispatch(dnsRecordFetchListSuccess(zoneId, response.body.result));
            } else {
                dispatch(notificationAddClientAPIError(dnsRecordFetchListError(), response));
            }
        }, function(error) {
            dispatch(notificationAddClientAPIError(dnsRecordFetchListError(), error));
        });
    }
}

export function dnsRecordUpdate(name) {
    return {
        type: ActionTypes.DNS_RECORD_UPDATE,
        name
    }
}

export function dnsRecordUpdateSuccess(zoneId, dnsRecord) {
    return {
        type: ActionTypes.DNS_RECORD_UPDATE_SUCCESS,
        zoneId,
        dnsRecord
    }
}

export function dnsRecordUpdateError() {
    return {
        type: ActionTypes.DNS_RECORD_UPDATE_ERROR
    }
}

export function asyncDNSRecordUpdate(zoneId, dnsRecord, proxied) {
    return dispatch => {
        dispatch(dnsRecordUpdate(dnsRecord.name));
        zoneDNSRecordPatch({zoneId: zoneId, dnsRecordId: dnsRecord.id, proxied: proxied}, function(response){
            if(v4ResponseOk(response)) {
                dispatch(dnsRecordUpdateSuccess(zoneId, response.body.result));
            } else {
                dispatch(notificationAddClientAPIError(dnsRecordUpdateError, response));
            }
        }, function(error){
            dispatch(notificationAddClientAPIError(dnsRecordUpdateError, error));
        });
    }
}
