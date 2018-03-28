'use strict';
const AWS = require('aws-sdk');
const IoT = new AWS.Iot();

exports.handler = (event, context, callback) => {
  // get the endpoint address
  IoT.describeEndpoint({}, (err, data) => {
    if (err) return callback(err);

    const iotEndpoint = data.endpointAddress;

    const clientId = 'iot-button-lambda';
    const iotTopic = '/myIotButton/clickType';

    const iotdata = new AWS.IotData({
      endpoint: iotEndpoint
    });
    const params = {
      topic: iotTopic,
      payload: JSON.stringify({
        clickType: `${event.clickType}_CLICK`,
        clientId: clientId
      }),
      qos: 0
    };
    iotdata.publish(params, function(err, data) {
      if (err) {
        return callback(err, err.stack);
      } else {
        console.log('message sent'); // successful response
        callback();
      }
    });
  });
};
