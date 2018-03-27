'use strict';

const AWS = require('aws-sdk');
import awsIot from 'aws-iot-device-sdk';
const IoT = new AWS.Iot();
const STS = new AWS.STS();
const roleName = 'serverless-notifications';

exports.handler = (event, context, callback) => {
  // get the endpoint address
  IoT.describeEndpoint({}, (err, data) => {
    if (err) return callback(err);

    const iotEndpoint = data.endpointAddress;
    const region = getRegion(iotEndpoint);

    // get the account id which will be used to assume a role
    STS.getCallerIdentity({}, (err, data) => {
      if (err) return callback(err);

      const params = {
        RoleArn: `arn:aws:iam::${data.Account}:role/${roleName}`,
        RoleSessionName: getRandomInt().toString()
      };

      // assume role returns temporary keys
      STS.assumeRole(params, (err, data) => {
        if (err) return callback(err);

        let client;
        const clientId = `iot-button-lambda-${getRandomInt().toString()}`;
        const iotTopic = '/myIotButton/clickType';
        const IoTDevice = {
          connect: (
            topic,
            iotEndpoint,
            region,
            accessKey,
            secretKey,
            sessionToken
          ) => {
            client = awsIot.device({
              region,
              protocol: 'sms',
              accessKeyId: accessKey,
              secretKey,
              sessionToken,
              port: 443,
              host: iotEndpoint,
              clientId: clientId
            });

            client.on('connect', onConnect);
            client.on('error', console.log);
          },

          send: message => client.publish(iotTopic, message)
        };

        const onConnect = () => {
          console.log('connected');
          IoTDevice.send(
            JSON.stringify({
              clickType: `${event.clickType}_CLICK`,
              clientId: clientId
            })
          );
          callback(null);
        };

        IoTDevice.connect(
          iotTopic,
          iotEndpoint,
          region,
          data.Credentials.AccessKeyId,
          data.Credentials.SecretAccessKey,
          data.Credentials.SessionToken
        );
      });
    });
  });
};

const getRegion = iotEndpoint => {
  const partial = iotEndpoint.replace('.amazonaws.com', '');
  const iotIndex = iotEndpoint.indexOf('iot');
  return partial.substring(iotIndex + 4);
};

// Get random Int
const getRandomInt = () => {
  return Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
};
