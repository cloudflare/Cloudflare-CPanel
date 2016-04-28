import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import { Route, Router, Redirect } from 'react-router';
import configureStore from './store/configureStore';
import routes from './routes';
import createHistory from 'history/lib/createHashHistory';

import http from 'cf-util-http';

const history = createHistory();
const store = configureStore(history);

/*
 * Register our RestProxyCallback to send all cf-util-http calls to
 * our backend instead of their actual endpoint.
 */
http.beforeSend(RestProxyCallback);


ReactDOM.render(
    <Provider store={store}>
       <Router history={history}>
           {routes}
       </Router>
    </Provider>,
    document.getElementById('root')
);



