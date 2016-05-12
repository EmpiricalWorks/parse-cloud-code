require('cloud/app.js');

var Mailgun = require('mailgun');
Mailgun.initialize('sandbox788c9f2dbbca4766be5ae734b8c5847f.mailgun.org', 'key-e074cdf4268854e4be36d660bea00d54');

// Use Parse.Cloud.define to define as many cloud functions as you want.
// For example:
Parse.Cloud.define("hello", function (request, response) {
  response.success("Hello world!");
});

var secretCode = "L’Oréal IT EE";

Parse.Cloud.beforeSave("_User", function (request, response) {
  var user = request.object;

  var code = user.get('code');
  var email = user.get('email');

  if (code != secretCode) {
    if (!code) { // If user does not has a code before, generate a 4 digits
      code = "" + Math.floor(Math.random() * 8999 + 1000);
      user.set('code', code);
    }
  }

  response.success();
});

function sendCodeToEmail(user, emailContent, response) {
  var code = user.get('code');
  var email = user.get('email');
  var lastCodeSentTime = user.get('lastCodeSentTime');

  console.log("last time to send the code to " + email + " is " + lastCodeSentTime);
  if (!!lastCodeSentTime) {
    var lastTime = lastCodeSentTime;
    var now = new Date();
    console.log("last email sent " + (now - lastTime) + "milliseconds ago.");
    if (now - lastTime < 1000 * 60) {
      if (response)
        response.error("failed to send code, you just requested it");
      return;
    }
  }

  //if user has the secret code , don't need to do anything
  if (code == secretCode) {
    if (response)
      response.error("You have the secret code. Why request code?");
    return;
  }
  //user.set('isSending', true);
  Mailgun.sendEmail({
    to: email,
    from: "L’Oréal IT Day \<it-day@empiricalworks.com.au>",
    subject: emailContent.subject,
    html: emailContent.content.replace('xxxx', code)
  }, {
    success: function (httpResponse) {
      console.log(httpResponse);
      user.set('lastCodeSentTime', new Date());
      user.set('password', code);
      user.save();
      console.log(email + " last code sent time is " + new Date());
      if (response) {
        response.success("successfully sent the code");
      }
    },
    error: function (httpResponse) {
      console.error(httpResponse);
      if (response)
        response.error("failed to send code");
    }
  });
}

Parse.Cloud.define("sendCodeToEmail", function (request, response) {
  Parse.Cloud.useMasterKey();
  var email = request.params.email;
  var emailContent = request.params.emailContent;
  var query = new Parse.Query(Parse.User);
  query.equalTo('email', email);
  query.find()
    .then(function (results) {
      if (results.length > 0) {
        var user = results[0];
        sendCodeToEmail(user, emailContent, response);
      } else {
        response.error("can not find the user with that email address");
      }
    })
    .then(null, function () {
      response.error("server error");
    });
});

Parse.Cloud.afterSave("_User", function (request) {

/*  Parse.Cloud.useMasterKey();
  var user = request.object;

  var code = user.get('code');
  var lastCodeSentTime = user.get('lastCodeSentTime');

  if (code != secretCode && (!lastCodeSentTime))
    sendCodeToEmail(user);*/

});

Parse.Cloud.define("getCode", function (request, response) {
  Parse.Cloud.useMasterKey();
  var query = new Parse.Query(Parse.User);
  query.equalTo('email', request.params.email);
  query.find()
    .then(function (results) {
      if (results.length > 0) {
        var user = results[0];
        sendCodeToEmail(user, request.params.emailContent, response);
      } else {
        response.error("can not find the user with that email address");
      }
    })
    .then(null, function () {
      response.error("server error");
    })
});

Parse.Cloud.define("verifyCode", function (request, response) {
  Parse.Cloud.useMasterKey();
  var query = new Parse.Query(Parse.User);
  query.equalTo('email', request.params.email);
  query.equalTo('code', request.params.code);
  query.find()
    .then(function (results) {
      if (results.length > 0) {
        response.success("code is correct.");
      } else {
        response.error("code is wrong");
      }
    })
    .then(null, function () {
      response.error("server error");
    })
});

Parse.Cloud.define("sendShareMail", function (request, response){
  Parse.Cloud.useMasterKey();
  Mailgun.sendEmail(request.params.email,
    {
      success: function (httpResponse) {
        if (response) {
          response.success(httpResponse.status);
        }
      },
      error: function (httpResponse) {
        if (response)
          response.error(httpResponse.status);
      }
    }
  );
});
