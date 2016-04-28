import { expect } from 'chai';
import { activeZoneReducer } from '../../reducers/activeZone';
import * as ActionTypes from '../../constants/ActionTypes';
import 'babel-polyfill'; //Object.Assign

describe('Active Zone Reducer', () => {
    it('should return the initial state', () => {
        expect(
            activeZoneReducer(undefined, {})
        ).to.eql({
                id: "",
                name: "",
            })
    })

    it('should set active zone', () => {
        expect(
            activeZoneReducer({}, {
                type: ActionTypes.ZONES_SET_ACTIVE_ZONE,
                zone: {id:1, name:"name"}
            })
        ).to.eql({
                    id: 1,
                    name: "name"
                }
        )
    })
})