import React, { Component } from 'react';
import { connect } from 'react-redux';
import { FormattedMessage, injectIntl } from 'react-intl';
import {
    Table,
    TableHead,
    TableBody,
    TableFoot,
    TableRow,
    TableHeadCell,
    TableCell
} from 'cf-component-table';
import Toggle from '../../components/CloudToggle/CloudToggle';
import _ from 'lodash';

import Loading from '../../components/Loading/Loading';
import { asyncDNSRecordCreate, asyncDNSRecordUpdate } from '../../actions/zoneDnsRecords';

class DNSRecordEditor extends Component {

    handleToggle(value, dnsRecord) {
        let { dispatch } = this.props;
        if(dnsRecord.id) {
            dispatch(asyncDNSRecordUpdate(dnsRecord.zone_id, dnsRecord, value));
        } else {
            dispatch(asyncDNSRecordCreate(dnsRecord.zone_id, dnsRecord.type, dnsRecord.name, dnsRecord.content));
        }
    }

    render() {
        return (
            <div>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableHeadCell><FormattedMessage id="container.dnsRecordEditor.thead.type" /></TableHeadCell>
                            <TableHeadCell><FormattedMessage id="container.dnsRecordEditor.thead.name" /></TableHeadCell>
                            <TableHeadCell><FormattedMessage id="container.dnsRecordEditor.thead.value" /></TableHeadCell>
                            <TableHeadCell><FormattedMessage id="container.dnsRecordEditor.thead.ttl" /></TableHeadCell>
                            <TableHeadCell><FormattedMessage id="container.dnsRecordEditor.thead.status" /></TableHeadCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {_.sortBy(_.values(this.props.dnsRecords), function(dnsRecord) { return dnsRecord.name; }).map(dnsRecord =>
                            <TableRow key={dnsRecord.name}>
                                <TableCell>{dnsRecord.type}</TableCell>
                                <TableCell>{dnsRecord.name}</TableCell>
                                <TableCell>{dnsRecord.content}</TableCell>
                                <TableCell>{dnsRecord.ttl}</TableCell>
                                <TableCell>
                                    {(this.props.updateIsFetching === dnsRecord.name) ?
                                        <Loading/>
                                        :
                                        <Toggle
                                            label="CloudFlare Provisioned"
                                            name={dnsRecord.name + "_provisioned"}
                                            value={dnsRecord.proxied}
                                            onChange={(e) => this.handleToggle(e, dnsRecord)}/>
                                        }
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        );
    }
}
function mapStateToProps(state) {
    return {
        activeZoneId: state.activeZone.id,
        dnsRecords: state.zoneDnsRecords.entities[state.activeZone.id],
        updateIsFetching: state.zoneDnsRecords.updateIsFetching
    }
}
export default injectIntl(connect(mapStateToProps)(DNSRecordEditor));