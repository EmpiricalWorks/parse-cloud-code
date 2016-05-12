// These two lines are required to initialize Express in Cloud Code.
express = require('express');
app = express();

// Global app configuration section
app.set('views', 'cloud/views');  // Specify the folder to find templates
app.set('view engine', 'jade');    // Set the template engine
app.use(express.bodyParser());    // Middleware for reading request body

// This is an example of hooking up a request handler with a specific request
// path and HTTP verb using the Express routing API.
/*app.get('/hello', function(req, res) {
 res.render('hello', { message: 'Congrats, you just set up your app!' });
 });*/

app.get('/', function(req, res) {
    res.render('login', {});
});
app.post('/itday-list/', function(req, res) {
    var parseBuffer = {
        doesPasswordMatch: false,
        itDayList: undefined
    };

    Parse.Config.get()
        .then(function success(config) {
            var ItDay;
            var itDayQuery;

            parseBuffer.doesPasswordMatch = (config.get('eventOrganiserPassword') === req.body.loginPassword);

            ItDay = Parse.Object.extend('ITDay');
            itDayQuery = new Parse.Query(ItDay);
            itDayQuery.include('survey');
            itDayQuery.equalTo('isActive', true);

            return itDayQuery.find();
        })
        .then(function success(itDayList) {
            parseBuffer.itDayList = itDayList.map(function(row){
                var itDayObject = {
                    country: row.get('country'),
                    surveyId: row.get('survey').id
                };
                return itDayObject;
            });

            if (parseBuffer.doesPasswordMatch) {
                res.render('itday_list', {
                    itDayList: parseBuffer.itDayList
                });
            }
            else {
                res.redirect('/');
            }
        });
});
app.get('/user-list/', function(req, res){
    var surveyId = req.query.surveyId;
    var query = new Parse.Query(Parse.Object.extend('SurveyAnswer'));
    var targetSurvey = new Parse.Object.extend('Survey');

    targetSurvey = targetSurvey.createWithoutData(surveyId);
    query.include('survey');
    query.include('user');
    query.equalTo('survey', targetSurvey);

    query.find()
        .then(function success(surveyAnswers){
            var users;
            var fetchedUsers = {};

            users = surveyAnswers.map(function(surveyAnswer){
                if(surveyAnswer.get('user') !== undefined) {
                    var user = surveyAnswer.get('user');

                    return user;
                }
            }).filter(function(userBeforeFilter){
                return (function(){
                    var returnVal = false;

                    returnVal = (userBeforeFilter !== undefined);
                    if(returnVal === true){
                        returnVal = returnVal && (fetchedUsers[userBeforeFilter.id] !== true);
                        fetchedUsers[userBeforeFilter.id] = true;
                    }

                    return returnVal;
                })();

            });


            res.render('user_list', {
                users: users
            });
        });
});

// // Example reading from the request query string of an HTTP get request.
// app.get('/test', function(req, res) {
//   // GET http://example.parseapp.com/test?message=hello
//   res.send(req.query.message);
// });

// // Example reading from the request body of an HTTP post request.
// app.post('/test', function(req, res) {
//   // POST http://example.parseapp.com/test (with request body "message=hello")
//   res.send(req.body.message);
// });

// Attach the Express app to Cloud Code.
app.listen();
