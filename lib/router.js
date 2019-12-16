var utilities = require('./utilities');
var url = require('url-join');
var tokenCsrfPage = '/html/home.html'; // Read https://github.com/ishan-marikar/dialog-router-api/issues/4 and https://gist.github.com/julianmejio/8df739bbdca10c045f7534d4e96e0eec

function HuaweiRouter(options) {
  this.options = options;
}

var API = HuaweiRouter.prototype;
module.exports = HuaweiRouter;
module.exports.create = create;

API.getMonthStatistics = function(token, callback) {
  var uri = url('http://', this.options.gateway, '/api/monitoring/month_statistics');
  utilities.contactRouter(uri, token, null, function(error, response) {
    callback(error, response);
  });
};

API.getSignal = function(token, callback) {
  var uri = url('http://', this.options.gateway, '/api/device/signal');
  utilities.contactRouter(uri, token, null, function(error, response) {
    callback(error, response);
  });
};

API.getStatus = function(token, callback) {
  var uri = url('http://', this.options.gateway, '/api/monitoring/status');
  utilities.contactRouter(uri, token, null, function(error, response) {
    callback(error, response);
  });
};

API.getTrafficStatistics = function(token, callback) {
  var uri = url('http://', this.options.gateway, '/api/monitoring/traffic-statistics');
  utilities.contactRouter(uri, token, null, function(error, response) {
    callback(error, response);
  });
};

API.getBasicSettings = function(token, callback) {
  var uri = url('http://', this.options.gateway, '/api/wlan/basic-settings');
  utilities.contactRouter(uri, token, null, function(error, response) {
    callback(error, response);
  });
};

API.getCurrentPLMN = function(token, callback) {
  var uri = url('http://', this.options.gateway, '/api/net/current-plmn');
  utilities.contactRouter(uri, token, null, function(error, response) {
    callback(error, response);
  });
};

API.getToken = function(callback) {
  var uri = url('http://', this.options.gateway, '/api/webserver/SesTokInfo');
  utilities.contactRouter(uri, {}, null, function(error, response) {
    if (response && response.SesInfo && response.TokInfo) {
      callback(error, {
        cookies: response.SesInfo[0],
        token: response.TokInfo[0]
      });
    } else {
      callback(Error("Could not connect"), null);
    }
  });
};

API.getLedStatus = function(token, callback) {
  var uri = url('http://', this.options.gateway, '/api/led/circle-switch');
  utilities.contactRouter(uri, token, null, function(error, response) {
    callback(error, response);
  });
};

API.setLedOn = function(token, value, callback) {
  var uri = url('http://', this.options.gateway, '/api/led/circle-switch');
  var body = {
    ledSwitch: value ? 1 : 0
  };
  body = `<?xml version:"1.0" encoding="UTF-8"?><request><ledSwitch>${value?'1':'0'}</ledSwitch></request>`
  utilities.contactRouter(uri, token, body, function(error, response) {
    callback(error, response);
  });
};

API.isLoggedIn = function(token, callback) {
  var uri = url('http://', this.options.gateway, '/api/user/state-login');
  utilities.contactRouter(uri, token, null, function(error, response) {
    callback(error, response);
  });
};

API.login = function(token, username, password, callback) {
  var gateway = this.options.gateway;
  var uri = url('http://', gateway, '/api/user/login');
  var body = {
    Username: username,
    password_type: 4,
    Password: utilities.SHA256andBase64(
      username + utilities.SHA256andBase64(password) + token.token
    )
  };
  utilities.contactRouter(uri, token, body, function(error, response) {
    callback(error, response);
  });
}

API.sendSms = function(token, phone, message, callback) {
    var gateway = this.options.gateway;
    utilities.updateToken(url('http://', gateway, tokenCsrfPage), token, () => {
        utilities.contactRouter(
            url('http://', gateway, '/api/sms/send-sms'),
            token,
            "<?xml version=\"1.0\" encoding=\"UTF-8\"?><request><Index>-1</Index><Phones><Phone>" + phone + "</Phone></Phones><Sca></Sca><Content>" + message + "</Content><Length>" + message.length + "</Length><Reserved>1</Reserved><Date>" + utilities.currentDate() + "</Date><SendType>0</SendType></request>",
            function(error, response) {
                callback(error, response);
            }
        );
    });
};

API.deleteSms = function(token, index, callback) {
    var gateway = this.options.gateway;
    utilities.updateToken(url('http://', gateway, tokenCsrfPage), token, () => {
        utilities.contactRouter(
            url('http://', gateway, '/api/sms/delete-sms'),
            token,
            "<?xml version=\"1.0\" encoding=\"UTF-8\"?><request><Index>" + index + "</Index></request>",
            function(error, response) {
                callback(error, response);
            }
        );
    });
};

API.getSmsCount = function(token, callback) {
  var uri = url('http://', this.options.gateway, '/api/sms/sms-count');
  utilities.contactRouter(uri, token, null, function(error, response) {
    callback(error, response);
  });
};

API.getAllSms = function(token, clean = false, callback) {
    var gateway = this.options.gateway;
    utilities.updateToken(url('http://', gateway, tokenCsrfPage), token, () => {
        utilities.getMessages(gateway, token, (error, response) => {
            const messages = utilities.parseMessages(response);
            if (!error && response && response.length > 0 && clean) {
                const index = response[0].Index;
                response.forEach((message) => {
                    if (message.Index) {
                        utilities.contactRouter(
                            url('http://', gateway, '/api/sms/delete-sms'),
                            token,
                            "<?xml version=\"1.0\" encoding=\"UTF-8\"?><request><Index>" + message.Index + "</Index></request>",
                            function() {}
                        );
                    }
                });
            }
            callback(error, messages);
        });
    });
}

API.getSms = function(token, page, count, callback) {
    var gateway = this.options.gateway;
    utilities.updateToken(url('http://', gateway, tokenCsrfPage), token, () => {
        utilities.contactRouter(
            url('http://', gateway, '/api/sms/sms-list'),
            token,
            "<?xml version=\"1.0\" encoding=\"UTF-8\"?><request><PageIndex>" + page + "</PageIndex><ReadCount>" + count + "</ReadCount><BoxType>1</BoxType><SortType>0</SortType><Ascending>0</Ascending><UnreadPreferred>1</UnreadPreferred></request>",
            function(error, response) {
                callback(error, utilities.parseMessages(response));
            }
        );
    });
};

function create(options) {
  return new HuaweiRouter(options);
}
