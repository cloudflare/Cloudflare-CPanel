import * as ActionTypes from '../constants/ActionTypes';

const initialState = {
    locale: "",
    translations: {},
    isFetching: false
};

export function intlReducer(state = initialState, action) {
    switch (action.type) {
        case ActionTypes.INTL_FETCH_TRANSLATIONS:
            return Object.assign({}, state, {
                isFetching: true
            });
        case ActionTypes.INTL_FETCH_TRANSLATIONS_SUCCESS:
            return Object.assign({}, state, {
                locale: action.locale,
                translations: action.translations,
                isFetching: false
            });
        case ActionTypes.INTL_FETCH_TRANSLATIONS_ERROR:
            return Object.assign({}, state, {
                isFetching: false
            });
        default:
            return state;
    }
}