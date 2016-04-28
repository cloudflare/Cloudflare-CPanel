import React, { Component } from 'react';
import { connect } from 'react-redux';
import { FormattedMessage, injectIntl } from 'react-intl';
import { Tabs, TabsPanel } from 'cf-component-tabs';
import { Heading } from 'cf-component-heading';
import C3Wrapper from 'react-c3-wrapper';
import _ from 'lodash';

const REQUESTS_TAB = 'requests';
const BANDWIDTH_TAB = 'bandwidth';
const UNIQUES_TAB = 'uniques';
const THREATS_TAB = 'threats';

class AnaltyicsPage extends Component {

    state = {
        activeTab: REQUESTS_TAB
    };

    handleTabChange(id) {
        this.setState({ activeTab: id });
    }

    render() {

        const { formatMessage } = this.props.intl;

        let { activeZoneId, allZoneAnalytics } = this.props;
        let analytics = Object.assign({}, allZoneAnalytics[activeZoneId]);

        let isEmpty = _.isEmpty(analytics);

        let cached = formatMessage({id: "containers.analyticsPage.cached"});
        let unCached = formatMessage({id: "containers.analyticsPage.uncached"});
        let threats = formatMessage({id: "containers.analyticsPage.threats"});
        let uniques = formatMessage({id: "containers.analyticsPage.uniques"});

        //for some reason this only renders correctly if we put the xformat in data AND axis
        let xformat = '%m/%d';

        return (
            <div>
                {isEmpty && (
                    <FormattedMessage id="errors.noActiveZoneSelected"/>
                )}
                {!isEmpty && (
                    <div>
                    <Heading size={1}><FormattedMessage id="container.analyticsPage.title"/></Heading>
                    <Tabs
                        activeTab={this.state.activeTab}
                        tabs={[
                          { id: REQUESTS_TAB, label: formatMessage({id: 'container.analyticsPage.tabs.requests'})},
                          { id: BANDWIDTH_TAB, label: formatMessage({id: 'container.analyticsPage.tabs.bandwidth'}) },
                          { id: UNIQUES_TAB, label: formatMessage({id: 'container.analyticsPage.tabs.uniques'})},
                          { id: THREATS_TAB, label: formatMessage({id: 'container.analyticsPage.tabs.threats'})}
                        ]}
                        onChange={this.handleTabChange.bind(this)}>

                        <TabsPanel id={ REQUESTS_TAB }>
                            <C3Wrapper config={{
                              data: {
                                x: 'x',
                                xFormat: xformat,
                                columns: [
                                  ['x'].concat(analytics.timeSeries),
                                  [cached].concat(analytics.requests[0]),
                                  [unCached].concat(analytics.requests[1])
                                ]
                              },
                              axis: {
                                x: {
                                    type: 'timeseries',
                                    tick: {
                                        format: xformat
                                    }
                                }
                              }
                            }}/>
                        </TabsPanel>

                        <TabsPanel id={ BANDWIDTH_TAB }>
                            <C3Wrapper config={{
                              data: {
                                x: 'x',
                                xFormat: xformat,
                                columns: [
                                  ['x'].concat(analytics.timeSeries),
                                  [cached].concat(analytics.bandwidth[0]),
                                  [unCached].concat(analytics.bandwidth[1])
                                ]
                              },
                              axis: {
                                x: {
                                    type: 'timeseries',
                                    tick: {
                                        format: xformat
                                    }
                                }
                              }
                            }}/>
                        </TabsPanel>

                        <TabsPanel id={ UNIQUES_TAB }>
                            <C3Wrapper config={{
                              data: {
                                x: 'x',
                                xFormat: xformat,
                                columns: [
                                  ['x'].concat(analytics.timeSeries),
                                  [uniques].concat(analytics.uniques[0])
                                ]
                              },
                              axis: {
                                x: {
                                    type: 'timeseries',
                                    tick: {
                                        format: xformat
                                    }
                                }
                              }
                            }}/>
                        </TabsPanel>

                        <TabsPanel id={ THREATS_TAB }>
                            <C3Wrapper config={{
                             data: {
                                x: 'x',
                                xFormat: xformat,
                                columns: [
                                  ['x'].concat(analytics.timeSeries),
                                  [threats].concat(analytics.threats[0])
                                ]
                              },
                              axis: {
                                x: {
                                    type: 'timeseries',
                                    tick: {
                                        format: xformat
                                    }
                                }
                              }
                            }}/>
                        </TabsPanel>
                    </Tabs>
                    </div>
                )}
            </div>
        );
    }
}
function mapStateToProps(state) {
    return {
        activeZoneId: state.activeZone.id,
        allZoneAnalytics: state.zoneAnalytics.entities,
    }
}

export default injectIntl(connect(mapStateToProps)(AnaltyicsPage));