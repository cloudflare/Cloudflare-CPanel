import * as ActionTypes from '../constants/ActionTypes';
import { setEmail } from '../utils/Auth/Auth';

const initialState = {
    isLoggedIn: false,
    isFetching: false
};

export function userReducer(state = initialState, action) {
    switch (action.type) {
        case ActionTypes.USER_LOGIN:
            return Object.assign({}, state, {
                isFetching: true
            })
        case ActionTypes.USER_LOGIN_SUCCESS:
            //routes.js needs cfEmail in localStorage to detect logged in state
            setEmail(action.email);
            return Object.assign({}, state, {
                isLoggedIn: true,
                isFetching: false
            })
        case ActionTypes.USER_LOGIN_ERROR:
            return Object.assign({}, state, {
                isFetching: false
            })
        case ActionTypes.USER_SIGNUP:
            return Object.assign({}, state, {
                isFetching: true
            })
        case ActionTypes.USER_SIGNUP_SUCCESS:
            return Object.assign({}, state, {
                isFetching: false
            })
        case ActionTypes.USER_SIGNUP_ERROR:
            return Object.assign({}, state, {
                isFetching: false
            })
        case ActionTypes.USER_LOGOUT:
            setEmail("");
            return Object.assign({}, state, {
                isLoggedIn: false
            })
        default:
            return state;
    }
}