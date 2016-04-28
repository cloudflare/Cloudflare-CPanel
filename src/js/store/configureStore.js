import { createStore, applyMiddleware } from 'redux';
import thunkMiddleware from 'redux-thunk';
import createLogger from 'redux-logger';
import rootReducer from '../reducers';
import { syncHistory } from 'redux-simple-router';

export default function configureStore(history, initialState) {
    const reduxRouterMiddleware = syncHistory(history)

    const logger = createLogger({ collapsed: true });

    const createStoreWithMiddleware = applyMiddleware(
        thunkMiddleware,
        logger,
        reduxRouterMiddleware
    )(createStore);
    const store = createStoreWithMiddleware(rootReducer, initialState);

    return store;
}