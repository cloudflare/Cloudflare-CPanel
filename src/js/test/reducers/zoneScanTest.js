import { expect } from 'chai';
import { zoneScanReducer } from '../../reducers/zoneScan.js';
import * as ActionTypes from '../../constants/ActionTypes';
import 'babel-polyfill'; //Object.Assign

describe('Zone Scan Reducer', () => {
    let zoneId = 'zoneId';
    let zoneScan = { 'show_interstitial': true };

    let reducedEntities = {
        'zoneId': {
            'show_interstitial': true
        }
    };

    let initialState = {
        entities: {},
        isFetching: false
    };

    it('should return the initial state', () => {
        expect(
            zoneScanReducer(undefined, {})
        ).to.eql(initialState)
    })

    it('should handle ZONE_FETCH_SCAN ', () => {
        expect(
            zoneScanReducer(initialState, {
                type: ActionTypes.ZONE_FETCH_SCAN
            })
        ).to.eql({
                entities: {},
                isFetching: true
            })
    })

    it('should handle ZONE_FETCH_SCAN_SUCCESS ', () => {
        expect(
            zoneScanReducer(initialState, {
                type: ActionTypes.ZONE_FETCH_SCAN_SUCCESS,
                zoneId,
                zoneScan
            })
        ).to.eql({'entities' : reducedEntities, 'isFetching': false})
    })

    it('should handle ZONE_FETCH_SCAN_ERROR ', () => {
        expect(
            zoneScanReducer(initialState, {
                type: ActionTypes.ZONE_FETCH_SCAN_ERROR
            })
        ).to.eql(initialState)
    })

    it('should handle ZONE_UPDATE_SCAN', () => {
        expect(
            zoneScanReducer(initialState, {
                type: ActionTypes.ZONE_UPDATE_SCAN,
                zoneId,
                zoneScan
            })
        ).to.eql({'entities' : reducedEntities, 'isFetching': true})
    })

    it('should handle ZONE_UPDATE_SCAN_SUCCESS ', () => {
        expect(
            zoneScanReducer(initialState, {
                type: ActionTypes.ZONE_UPDATE_SCAN_SUCCESS,
                zoneId,
                zoneScan
            })
        ).to.eql({'entities' : reducedEntities, 'isFetching': false})
    })

    it('should handle ZONE_UPDATE_SCAN_ERROR', () => {
        expect(
            zoneScanReducer(initialState, {
                type: ActionTypes.ZONE_UPDATE_SCAN_ERROR,
                zoneId,
                zoneScan
            })
        ).to.eql({'entities' : reducedEntities, 'isFetching': false})
    })
})