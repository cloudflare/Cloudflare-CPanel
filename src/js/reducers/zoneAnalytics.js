import * as ActionTypes from '../constants/ActionTypes';
import _ from 'lodash';

const initialState = {
    entities: {},
    isFetching: false
};

export function zoneAnalyticsReducer(state = initialState, action) {
    switch (action.type) {
        case ActionTypes.ZONE_FETCH_ANALYTICS:
            return Object.assign({}, state, {
                isFetching: true
            })
        case ActionTypes.ZONE_FETCH_ANALYTICS_SUCCESS:
            let newZoneAnalyticsEntity = {};
            newZoneAnalyticsEntity[action.zoneId] = buildZoneAnalyticsData(action.zoneAnalytics);

            return Object.assign({}, state, {
                entities: _.merge(state.entities, newZoneAnalyticsEntity),
                isFetching: false
            })
        case ActionTypes.ZONE_FETCH_ANALYTICS_ERROR:
            return Object.assign({}, state, {
                isFetching: false
            })
        default:
            return state;
    }
}

function buildZoneAnalyticsData(zoneAnalyticsResponse) {
    let data = {
        timeSeries: [],
        requests: [
            [],
            []
        ],
        bandwidth: [
            [],
            []
        ],
        threats: [
            []
        ],
        uniques: [
            []
        ]

    };

    zoneAnalyticsResponse.timeseries.forEach(function(analyticsInterval){
        data.timeSeries.push(new Date(analyticsInterval.since));
        if(typeof analyticsInterval.requests !== 'undefined') {
            data.requests[0].push(analyticsInterval.requests.cached);
            data.requests[1].push(analyticsInterval.requests.uncached);
        }
        if(typeof analyticsInterval.bandwidth !== 'undefined') {
            data.bandwidth[0].push(analyticsInterval.bandwidth.cached);
            data.bandwidth[1].push(analyticsInterval.bandwidth.uncached);
        }
        if(typeof analyticsInterval.threats !== 'undefined') {
            data.threats[0].push(analyticsInterval.threats.all);
        }
        if(typeof analyticsInterval.uniques !== 'undefined') {
            data.uniques[0].push(analyticsInterval.threats.all);
        }
    });
    return data;
}