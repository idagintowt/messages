import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import Validator from 'validator';
import {
  Container,
  Row,
  Col,
  ListGroupItem,
  ListGroup,
  Button,
  Form,
  Label,
  Input,
  Collapse, TabContent, TabPane, Nav, NavItem, NavLink, Table,
} from 'reactstrap';

import FontAwesome from 'react-fontawesome';
import ListPagination from '../../../../../components/Pagination/ListPagination';
import classnames from 'classnames';
import lodash from 'lodash';
import callApi from '../../../../../shared/util/Api/apiCaller';

class MessagesListPage extends Component {
  constructor(props, context) {
    super(props, context);
    this.handleSearchChange = this.handleSearchChange.bind(this);
    this.setPage = this.setPage.bind(this);
    this.isOpen = this.isOpen.bind(this);
    this.toggleTab = this.toggleTab.bind(this);
    this.sendMessage = this.sendMessage.bind(this);
    this.state = {
      activeTab: '1',
      list: [],
      data: [],
      owner: 0,
      page: 1,
      limit: 10,
      itemsCount: 0,
      search: this.props.user.data.id,
      collapse: false,
      ranks: [],
    };
  }

  componentDidMount() {
    this.setState({ isMounted: true }); // eslint-disable-line
    if (this.context.socket) {
      this.context.socket.emit('getConversations', { page: 1, filter: this.state.search });
      this.context.socket.on('conversationsList', (data) => {
        if (data.conversations.length > 0) {
          this.setState({ list: data.conversations, page: data.page, itemsCount: data.count, search: data.filter });
        }
      });
      this.context.socket.on('reloadConversationList', () => {
        this.context.socket.emit('getConversations', { page: this.state.page, filter: this.state.search });
      });
    }
    callApi('messages/ranks', 'get', null, this.props)
      .then((data) => {
        this.setState({ ranks: data });
      });
  }

  componentWillUnmount() {
    this.context.socket.off('conversationsList');
    this.context.socket.off('Messages.Create');
    this.context.socket.off('reloadConversationList');
  }

  setPage(page) {
    if (this.context.socket) this.context.socket.emit('getConversations', { page, filter: this.state.search });
  }

  toggleTab(tab) {
    if (this.state.activeTab !== tab) {
      this.setState({
        activeTab: tab,
      });
    }
  }



  handleSearchChange(event) {
    if (this.context.socket) {
      if (event.target.value.length > 0 && Validator.isInt(event.target.value)) {
        this.context.socket.emit('getConversations', { page: 1, filter: parseInt(event.target.value, 10) });
      } else {
        this.context.socket.emit('getConversations', { page: 1, filter: this.props.user.data.id });
      }
    }
  }

  isOpen(active, length) {
    if (length > 7) this.setState({ collapse: active });
  }

  showRanks() {
    return this.state.ranks.map((user) =>
      <tr>
        <td>{`${user.nick} [${user.id}]`}</td>
        <td>{user.permissions.role}</td>
        <td>{user.permissions.description}</td>
        <td><Button
          id={user._id}
          size="sm"
          color="secondary" onClick={this.sendMessage}
        > {this.props.intl.messages.write}</Button></td>
      </tr>,
    );
  }

  sendMessage(event) {
    const user = [event.target.id];
    this.props.addUser(user, true);
  }

  showList() {
    const users = {};
    for (const i in this.state.list) {
      const array = [];
      for (const user in this.state.list[i].participants) {
        if (this.state.list[i].participants[user].id !== this.props.user.data.id) {
          array.push(` ${this.state.list[i].participants[user].nick} [${this.state.list[i].participants[user].id}]`);
        }
      }
      users[this.state.list[i].channel] = { displayed: array.slice(0, 7), hidden: array };
      if (array.length > 5) users[this.state.list[i].channel].displayed.push(' ...');
    }

    return this.state.list.map((chat) =>
      <ListGroupItem
        id={chat.channel}
        className={(chat.active === false && 'inactive') || (chat.newEvents === true && 'event') || 'active'}
      >
        <Link
          id={chat.channel}
          to={`${this.context.router.route.match.url}/show/${chat._id}`}
          onMouseOver={() => this.isOpen(chat.channel, users[chat.channel].hidden.length)}
          onMouseOut={() => this.isOpen(false, users[chat.channel].hidden.length)}
        >
          <FontAwesome name={chat._type === 'private' ? 'user' : chat._type === 'official' ? 'user-circle-o' : 'users'}
            className="fa-fw"
          />
          {users[chat.channel].displayed}
        </Link>
        <Collapse isOpen={chat.channel === this.state.collapse}>
          {users[chat.channel].hidden}
        </Collapse>
      </ListGroupItem>,
    );
  }

  render() {
    return (
      <Container>
        <Row>
          <Col xs="3">
            <Form><Input
              className="form-control"
              name="search" type="number"
              placeholder={this.props.intl.messages.search}
              onChange={this.handleSearchChange}
            /></Form>
          </Col>
        </Row>
        <Row>
          <Col className="title">
            <Label>{this.props.intl.messages.messages}</Label>
          </Col>
        </Row>
        <div className="channelsContainer">
          <Nav tabs className="navTabs">
            <NavItem>
              <NavLink
                className={classnames({ active: this.state.activeTab === '1' })}
                onClick={() => this.toggleTab('1')}
              >
                {this.props.intl.messages.messages}
              </NavLink>
            </NavItem>
            <NavItem>
              <NavLink
                className={classnames({ active: this.state.activeTab === '2' })}
                onClick={() => {
                  this.toggleTab('2');
                }}
              >
                {this.props.intl.messages.administration}
              </NavLink>
            </NavItem>
          </Nav>
          <TabContent activeTab={this.state.activeTab}>
            <TabPane tabId="1">
              <ListGroup>
                {this.showList()}
              </ListGroup>
              <Row>
                <Col>
                  <ListPagination rowsPerPage={this.state.limit}
                    itemsCount={this.state.itemsCount}
                    setPage={this.setPage}
                  />
                </Col>
              </Row>
            </TabPane>
            <TabPane tabId="2">
              <Table className="ranksList">
                <thead>
                <tr>
                  <th>{this.props.intl.messages.nick}</th>
                  <th>{this.props.intl.messages.role}</th>
                  <th>{this.props.intl.messages.description}</th>
                  <th>{this.props.intl.messages.message}</th>
                </tr>
                </thead>
                <tbody>
                {this.state.ranks.length > 0 && this.showRanks()}
                </tbody>
              </Table>
            </TabPane>
          </TabContent>
        </div>
      </Container>
    );
  }
}

MessagesListPage.contextTypes = {
  router: PropTypes.object,
  socket: PropTypes.object.isRequired,
};

MessagesListPage.propTypes = {
  dispatch: PropTypes.func.isRequired,
  intl: PropTypes.object.isRequired,
  user: PropTypes.object.isRequired,
  addUser: PropTypes.func.isRequired,
};

// Retrieve data from store as props
function mapStateToProps(store) {
  return {
    intl: store.intl,
    user: store.user,
    playersOnline: store.game.playersOnline,
  };
}

export default connect(mapStateToProps)(MessagesListPage);
