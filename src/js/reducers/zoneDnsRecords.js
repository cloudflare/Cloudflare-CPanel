import { normalize, Schema, arrayOf } from 'normalizr';
import _ from 'lodash';
import * as ActionTypes from '../constants/ActionTypes';

const initialState = {
    entities: {},
    result: [],
    isFetching: false,
    updateIsFetching: ""
};

export function dnsRecordsReducer(state = initialState, action) {
    switch (action.type) {
        case ActionTypes.DNS_RECORD_CLEAR_ALL:
            let dnsRecordEntities = state.entities;
            dnsRecordEntities[action.zoneId] = {};

            return Object.assign({}, state, {
                entities: dnsRecordEntities
            })
        case ActionTypes.DNS_RECORD_CREATE:
            return Object.assign({}, state, {
                updateIsFetching: action.name
            })
        case ActionTypes.DNS_RECORD_CREATE_SUCCESS:
            return Object.assign({}, state, {
                entities: patchDnsRecord(action.zoneId, state.entities, action.dnsRecord),
                updateIsFetching: ""
            })
        case ActionTypes.DNS_RECORD_CREATE_ERROR:
            return Object.assign({}, state, {
                updateIsFetching: ""
            })
        case ActionTypes.DNS_RECORD_FETCH_LIST:
            return Object.assign({}, state, {
               isFetching: true
            })
        case ActionTypes.DNS_RECORD_FETCH_LIST_SUCCESS:
            let dnsRecordSchema = new Schema(action.zoneId, {idAttribute: 'name'});
            let normalizedDnsRecords = normalize(action.dnsRecords, arrayOf(dnsRecordSchema));

            return Object.assign({}, state, {
                entities: _.merge(state.entities, normalizedDnsRecords.entities),
                result: _.merge(state.result, normalizedDnsRecords.result),
                isFetching: false
            })
        case ActionTypes.DNS_RECORD_FETCH_LIST_ERROR:
            return Object.assign({}, state, {
                isFetching: false
            })
        case ActionTypes.DNS_RECORD_UPDATE:
            return Object.assign({}, state, {
                updateIsFetching: action.name
            })
        case ActionTypes.DNS_RECORD_UPDATE_SUCCESS:
            return Object.assign({}, state, {
                entities: patchDnsRecord(action.zoneId, state.entities, action.dnsRecord),
                updateIsFetching: ""
            })
        case ActionTypes.DNS_RECORD_UPDATE_ERROR:
            return Object.assign({}, state, {
                updateIsFetching: ""
            })
        default:
            return state;
    }
}

function patchDnsRecord(zoneId, dnsRecordList, dnsRecord) {
    dnsRecordList[zoneId][dnsRecord.name] = dnsRecord;
    return dnsRecordList;
}
