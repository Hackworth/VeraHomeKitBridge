
var types = require("../lib/HAP-NodeJS/accessories/types.js");
var request = require("request");

var settingCoveringLevel = false;
var nextCoveringLevel = null;

function WindowCovering(veraIP, device) {
	this.device = device;
	this.veraIP = veraIP;
	this.name = device.name;
}

WindowCovering.prototype = {

	/**
	 *  This method is called when the Window Covering level changes
	 */
	onSetLevel: function(level) {

		if (settingCoveringLevel) {
			nextCoveringLevel = level;
			return;
		} else {
			settingCoveringLevel = true;

		}

		console.log("Setting the " + this.device.name + " level to " + level + "%");

		var self = this;
		request.get({url: "http://" + this.veraIP + ":3480/data_request?id=lu_action&output_format=xml&DeviceNum=" + this.device.id + "&serviceId=urn:upnp-org:serviceId:Dimming1&action=SetLoadLevelTarget&newLoadlevelTarget=" + level},
			function(err, response, body) {
				if (!err && response.statusCode == 200) {
					console.log("The " + self.device.name + " level has been changed to " + level + "%");
				} else {
					console.log("Error '" + err + "' changing the " + self.device.name + " level:  " + body);
				}
				settingCoveringLevel = false;
				if (nextCoveringLevel) {
					var level = nextCoveringLevel;
					nextCoveringLevel = null;
					self.onSetBrightness(level);
				}
			}
		);

	},

	/**
	 *  This method is called when the Window Covering is closed (off) or open (on)
	 */
	onSetPowerState: function(powerOn) {

		if (powerOn) {
			console.log("Turning on the " + this.device.name);
		} else {
			console.log("Turning off the " + this.device.name);
		}

		var binaryState = powerOn ? 1 : 0;
		var self = this;
		request.get({url: "http://" + this.veraIP + ":3480/data_request?id=lu_action&output_format=xml&DeviceNum=" + this.device.id + "&serviceId=urn:upnp-org:serviceId:SwitchPower1&action=SetTarget&newTargetValue=" + binaryState},
			function(err, response, body) {
				if (!err && response.statusCode == 200) {
					if (powerOn) {
						console.log("The " + self.device.name + " has been turned on");
					} else {
						console.log("The " + self.device.name + " has been turned off");
					}
				} else {
					console.log("Error '" + err + "' turning the " + self.device.name + " on/off:  " + body);
				}
			}
		);
	},

	/**
	 *  This method is called when the user tries to identify this accessory
	 */
	onIdentify: function(identify) {
		if (identify) {
			console.log("User wants to identify this accessory");
		} else {
			console.log("User is finished identifying this accessory");
		}
	},

  getServices: function() {
    var that = this;
    return [{
      sType: types.ACCESSORY_INFORMATION_STYPE,
      characteristics: [{
        cType: types.NAME_CTYPE,
        onUpdate: null,
        perms: ["pr"],
        format: "string",
        initialValue: this.name,
        supportEvents: false,
        supportBonjour: false,
        manfDescription: "Name of the accessory",
        designedMaxLength: 255
      },{
        cType: types.MANUFACTURER_CTYPE,
        onUpdate: null,
        perms: ["pr"],
        format: "string",
        initialValue: "Z-Wave",
        supportEvents: false,
        supportBonjour: false,
        manfDescription: "Manufacturer",
        designedMaxLength: 255
      },{
        cType: types.MODEL_CTYPE,
        onUpdate: null,
        perms: ["pr"],
        format: "string",
        initialValue: "DimmableLight",
        supportEvents: false,
        supportBonjour: false,
        manfDescription: "Model",
        designedMaxLength: 255
      },{
        cType: types.SERIAL_NUMBER_CTYPE,
        onUpdate: null,
        perms: ["pr"],
        format: "string",
        initialValue: "" + this.device.id,
        supportEvents: false,
        supportBonjour: false,
        manfDescription: "SN",
        designedMaxLength: 255
      },{
        cType: types.IDENTIFY_CTYPE,
        onUpdate: function(value) { that.onIdentify(value); },
        perms: ["pw"],
        format: "bool",
        initialValue: false,
        supportEvents: false,
        supportBonjour: false,
        manfDescription: "Identify Accessory",
        designedMaxLength: 1
      }]
    },{
      sType: types.SWITCH_STYPE,
      characteristics: [{
        cType: types.NAME_CTYPE,
        onUpdate: null,
        perms: ["pr"],
        format: "string",
        initialValue: this.name,
        supportEvents: false,
        supportBonjour: false,
        manfDescription: "Name of service",
        designedMaxLength: 255
      },
      {
    	cType: types.BRIGHTNESS_CTYPE,
    	onUpdate: function(value) { that.onSetLevel(value); },
    	perms: ["pw","pr","ev"],
		format: "int",
		initialValue: 0,
		supportEvents: false,
		supportBonjour: false,
		manfDescription: "Adjust the level",
		designedMinValue: 0,
		designedMaxValue: 100,
		designedMinStep: 1,
		unit: "%"
    },
      {
        cType: types.POWER_STATE_CTYPE,
        onUpdate: function(value) { that.onSetPowerState(value); },
        perms: ["pw","pr","ev"],
        format: "bool",
        initialValue: false,
        supportEvents: false,
        supportBonjour: false,
        manfDescription: "Change the power state",
        designedMaxLength: 1
      }]
    }];
  }
};

module.exports.initializeWithDevice = WindowCovering;
