import React, { Component } from 'react';
import awsIot from 'aws-iot-device-sdk';
import logo from './logo.svg';
import './App.css';

class App extends Component {
  IoT = {};
  iotKeys = {};
  clientId = `iot-button-client-${Math.floor(
    Math.random() * Number.MAX_SAFE_INTEGER
  ).toString()}`;
  lambdaEndpoint = 'https://d3m6o6uj50.execute-api.us-east-1.amazonaws.com/dev/iot/keys';
  state = {
    clickType: '',
    clientId: ''
  };

  componentDidMount() {
    this.getKeys();
  }

  getKeys = () => {
    fetch(this.lambdaEndpoint)
      .then(res => res.json())
      .then(res => {
        console.log(`Endpoint: ${res.iotEndpoint},
                        Region: ${res.region},
                        AccessKey: ${res.accessKey},
                        SecretKey: ${res.secretKey},
                        SessionToken: ${res.sessionToken}`);
        this.iotKeys = res;
        this.init();
      })
      .catch(err => {
        console.log(err);
        this.getKeys();
      });
  };

  init = () => {
    let client;
    const decoder = new TextDecoder('utf-8');
    // TODO this should be set in config and/or per environment
    const iotTopic = '/myIotButton/clickType';
    this.IoT = {
      connect: (
        topic,
        iotEndpoint,
        region,
        accessKey,
        secretKey,
        sessionToken
      ) => {
        client = new awsIot.device({
          region,
          protocol: 'wss',
          accessKeyId: accessKey,
          secretKey,
          sessionToken,
          port: 443,
          host: iotEndpoint,
          clientId: this.clientId
        });

        client.on('connect', onConnect);
        client.on('message', onMessage);
        client.on('error', onError);
        client.on('reconnect', onReconnect);
        client.on('offline', onOffline);
        client.on('close', onClose);
      },

      send: message => client.publish(iotTopic, message),

      sendToUser: (topic, message) => client.publish(topic, message)
    };

    const onConnect = () => {
      console.log(`subscribed to ${iotTopic} with ${this.clientId}`);
      client.subscribe(iotTopic);
    };

    const onMessage = (topic, data) => {
      const { clickType, clientId } = JSON.parse(decoder.decode(data));
      console.log(clickType, clientId);
      this.setState({ clickType, clientId });
    };

    const onError = () => {};
    const onReconnect = () => {};
    const onOffline = () => {};
    const onClose = () => {
      console.log('Connection failed');
    };

    this.IoT.connect(
      iotTopic,
      this.iotKeys.iotEndpoint,
      this.iotKeys.region,
      this.iotKeys.accessKey,
      this.iotKeys.secretKey,
      this.iotKeys.sessionToken
    );
  };

  render() {
    return (
      <div className="App">
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <h1 className="App-title">Welcome to React</h1>
        </header>
        <p className="App-intro">
          To get started, edit <code>src/App.js</code> and save to reload.
        </p>
        <p>{this.state.clickType}</p>
        <p>{this.state.clientId}</p>
      </div>
    );
  }
}

export default App;
