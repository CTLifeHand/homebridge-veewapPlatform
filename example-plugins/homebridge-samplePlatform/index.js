// var http = require('http');
var Accessory, Service, Characteristic, UUIDGen;
const WebSocket = require('ws');
const ReconnectingWebSocket = require('reconnecting-websocket');
// import ReconnectingWebSocket from 'reconnecting-websocket';

module.exports = function (homebridge) {
  console.log("homebridge API version: " + homebridge.version);

  // Accessory must be created from PlatformAccessory Constructor
  Accessory = homebridge.platformAccessory;

  // Service and Characteristic are from hap-nodejs
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;
  UUIDGen = homebridge.hap.uuid;

  // For platform plugin to be considered as dynamic platform plugin,
  // registerPlatform(pluginName, platformName, constructor, dynamic), dynamic must be true
  homebridge.registerPlatform("homebridge-samplePlatform", "SamplePlatform", SamplePlatform, true);
}

// Function invoked when homebridge tries to restore cached accessory.
// Developer can configure accessory at here (like setup event handler).
// Update current value.
SamplePlatform.prototype.configureAccessory = function (accessory) {
  this.log(accessory.displayName, "Configure Accessory");
  var platform = this;

  // Set the accessory to reachable if plugin can currently process the accessory,
  // otherwise set to false and update the reachability later by invoking 
  // accessory.updateReachability()
  accessory.reachable = true;

  accessory.on('identify', function (paired, callback) {
    this.log(accessory.displayName, "Identify!!!");
    callback();
  });

  if (accessory.getService(Service.Lightbulb)) {
    accessory.getService(Service.Lightbulb)
      .getCharacteristic(Characteristic.On)
      .on('set', function (value, callback) {
        this.log(`正在操作开关-configureAccessory`);
        // console.log(accessory);
        this.log(accessory.displayName, "Light -> " + value);
        const switchMessage = {};
        switchMessage.type = 217;
        switchMessage.id = accessory.id;
        switchMessage.isOpen = value;

        // this.ws.send(JSON.stringify(switchMessage));
        this.sendMessage(switchMessage);
        // 告诉手机？
        callback();
      });
  }

  this.accessories.push(accessory);
}


// Sample function to show how developer can add accessory dynamically from outside event
SamplePlatform.prototype.addAccessory = function (veewapDevice) {

  var accessoryName = veewapDevice.name;
  this.log("Add Accessory");
  var platform = this;
  var uuid;

  uuid = UUIDGen.generate(accessoryName + Math.random());

  var newAccessory = new Accessory(accessoryName, uuid);

  newAccessory.id = veewapDevice.id;

  newAccessory.on('identify', function (paired, callback) {

    // 命名的时候调用
    platform.log(newAccessory.displayName, "Identify!!!");
    callback();
  });
  // Plugin can save context on accessory to help restore accessory in configureAccessory()
  // newAccessory.context.something = "Something"

  // Make sure you provided a name for service, otherwise it may not visible in some HomeKit apps
  newAccessory.addService(Service.Lightbulb, newAccessory.displayName)
    .getCharacteristic(Characteristic.On)
    .on('set', function (value, callback) {
      /*
      Characteristic {
        displayName: 'On',
        UUID: '00000025-0000-1000-8000-0026BB765291',
        iid: 10,
        value: false,
        status: null,
        eventOnlyCharacteristic: false,
        props:
        { format: 'bool',
          unit: null,
          minValue: null,
          maxValue: null,
          minStep: null,
          perms: [ 'pr', 'pw', 'ev' ] },
        subscriptions: 1,
        _events: { change: [Function: bound ], set: [Function] },
        _eventsCount: 2 }
      */
     
      this.log(newAccessory.displayName, "Light -> " + value);
      // this.log(this);// Characteristic
      var switchMessage = {};
      switchMessage.type = 217;
      switchMessage.id = newAccessory.id;
      switchMessage.isOpen = value;
      // this.ws.send(JSON.stringify(switchMessage));
      this.sendMessage(switchMessage);
      callback();
    }.bind(this));

  newAccessory.getService(Service.Lightbulb)
    .updateCharacteristic(Characteristic.On, Boolean(veewapDevice.isOpen));
  this.accessories.push(newAccessory);
  this.api.registerPlatformAccessories("homebridge-samplePlatform", "SamplePlatform", [newAccessory]);
}
// Handler will be invoked when user try to config your plugin.
// Callback can be cached and invoke when necessary.

SamplePlatform.prototype.configurationRequestHandler = function (context, request, callback) {
  this.log("Context: ", JSON.stringify(context));
  this.log("Request: ", JSON.stringify(request));

  // Check the request response
  if (request && request.response && request.response.inputs && request.response.inputs.name) {
    this.addAccessory(request.response.inputs.name);

    // Invoke callback with config will let homebridge save the new config into config.json
    // Callback = function(response, type, replace, config)
    // set "type" to platform if the plugin is trying to modify platforms section
    // set "replace" to true will let homebridge replace existing config in config.json
    // "config" is the data platform trying to save
    callback(null, "platform", true, { "platform": "SamplePlatform", "otherConfig": "SomeData" });
    return;
  }

  // - UI Type: Input
  // Can be used to request input from user
  // User response can be retrieved from request.response.inputs next time
  // when configurationRequestHandler being invoked


  var respDict = {
    "type": "Interface",
    "interface": "input",
    "title": "Add Accessory",
    "items": [
      {
        "id": "name",
        "title": "Name",
        "placeholder": "Fancy Light"
      }//, 
      // {
      //   "id": "pw",
      //   "title": "Password",
      //   "secure": true
      // }
    ]
  }



  // - UI Type: List
  // Can be used to ask user to select something from the list
  // User response can be retrieved from request.response.selections next time
  // when configurationRequestHandler being invoked

  // var respDict = {
  //   "type": "Interface",
  //   "interface": "list",
  //   "title": "Select Something",
  //   "allowMultipleSelection": true,
  //   "items": [
  //     "A","B","C"
  //   ]
  // }

  // - UI Type: Instruction
  // Can be used to ask user to do something (other than text input)
  // Hero image is base64 encoded image data. Not really sure the maximum length HomeKit allows.

  // var respDict = {
  //   "type": "Interface",
  //   "interface": "instruction",
  //   "title": "Almost There",
  //   "detail": "Please press the button on the bridge to finish the setup.",
  //   "heroImage": "base64 image data",
  //   "showActivityIndicator": true,
  // "showNextButton": true,
  // "buttonText": "Login in browser",
  // "actionURL": "https://google.com"
  // }

  // Plugin can set context to allow it track setup process
  context.ts = "Hello";

  // Invoke callback to update setup UI
  callback(respDict);
}


SamplePlatform.prototype.updateAccessoriesReachability = function () {
  this.log("Update Reachability");
  for (var index in this.accessories) {
    var accessory = this.accessories[index];
    accessory.updateReachability(false);
  }
}

// Sample function to show how developer can remove accessory dynamically from outside event
SamplePlatform.prototype.removeAccessory = function () {
  this.log("Remove Accessory");
  this.api.unregisterPlatformAccessories("homebridge-samplePlatform", "SamplePlatform", this.accessories);

  this.accessories = [];
}

SamplePlatform.prototype.getAccessaryByID = function (ID) {
  for (let index = 0; index < this.accessories.length; index++) {
    const accessory = this.accessories[index];
    if (accessory.id === ID) {
      return accessory;
    }
  }
  return null;
}


// 增加JSON对解析
SamplePlatform.prototype.sendMessage = function (data) {
  var message = JSON.stringify(data);
  this.log(`message : ${message}`);

  // this.ws.send(message);

  if (this.ws.readyState === 1) {
    this.ws.send(message);
  }else{
    this.ws.reconnect();
  }
  
}


SamplePlatform.prototype.connectToWebSocket = function (message) {

  const options = {
    WebSocket: WebSocket, // custom WebSocket constructor
    connectionTimeout: 1000,
    maxRetries: 10,
  };

  const ws = new ReconnectingWebSocket('ws://192.168.3.65:9054', [], options);
  this.ws = ws;

  ws.addEventListener('message', function incoming(messageEvent) {
    // console.log(data);
    // console.log(`data的类型是 ${typeof data}`);
    const message = JSON.parse(messageEvent.data);
    // 注意这里this 指向Websocket
    // console.log(this);
    // console.log(`this的类型是 ${typeof this}`);
    // console.log(that);
    // console.log(`that的类型是 ${typeof that}`);

    // console.log(`message的类型是 ${typeof message}`);

    console.log(message);
    // type 0 初始化
    if (message.type === 0) {
      // this.homedata = message;
      // this.deviceArray = message.VMDeviceArray;
      this.log(`收到的设备`);
      // console.log(that.deviceArray);

      // 先全部清楚
      this.removeAccessory();

      message.VMDeviceArray.forEach(device => {
        // console.log(device);
        this.addAccessory(device);
      });
    } else {
      if (message.success !== 1) {
        this.log(`错误信息`);
        this.log(message);
        return;
      }

      // this.log(`其他信息`);
      // this.log(message);

      if (message.type === 217) {
        // this.log(this.accessories);
        var accessory = this.getAccessaryByID(message.id);
        if (accessory && accessory.getService(Service.Lightbulb)) {
          accessory.getService(Service.Lightbulb)
            .updateCharacteristic(Characteristic.On, Boolean(message.isOpen));
        }
      }

    }
  }.bind(this))

  ws.addEventListener('open', function open() {
    var openMessage = {};
    openMessage.type = 0;

    const string = JSON.stringify(openMessage);
    console.log(`string:${string}`);

    ws.send(string);
  }.bind(this))

}



// Platform constructor
// config may be null
// api may be null if launched from old homebridge version
function SamplePlatform(log, config, api) {
  log("SamplePlatform Init");
  var platform = this;
  this.log = log;
  this.config = config;
  this.accessories = [];

  if (api) {
    // Save the API object as plugin needs to register new accessory via this object
    this.api = api;

    // Listen to event "didFinishLaunching", this means homebridge already finished loading cached accessories.
    // Platform Plugin should only register new accessory that doesn't exist in homebridge after this event.
    // Or start discover new accessories.
    this.api.on('didFinishLaunching', function () {
      this.log("DidFinishLaunching");

      this.connectToWebSocket();

    }.bind(this));
  }
}