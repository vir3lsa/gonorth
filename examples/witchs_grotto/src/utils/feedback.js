import AWS from "aws-sdk";
import { v4 as uuidv4 } from "uuid";

/*
 * Configure the SDK to use anonymous identity
 */
AWS.config.update({
  region: "eu-west-2",
  credentials: new AWS.CognitoIdentityCredentials({
    IdentityPoolId: "eu-west-2:f867fb12-e87c-451b-a63c-207daf67fbd2"
  })
});

const docClient = new AWS.DynamoDB.DocumentClient();

export const handleSubmitFeedback = (feedback, name, logs) => {
  const feedbackObj = {
    id: uuidv4(),
    feedback,
    name,
    logs
  };

  const params = {
    TableName: "bramble-feedback",
    Item: feedbackObj
  };

  docClient.put(params, (err) => {
    if (err) {
      console.error(err, err.stack);
    }
  });
};
