exports = module.exports;

var
events   = require('events'),
sys      = require('util'),
net      = require('net'),
options  = require('./options').options,
commands = require('./options').Command
;

exports.commands = commands;
exports.options = options;

function TelnetSession(host, port, options) {
	if (false === (this instanceof TelnetSession)) {
		return new TelnetSession(host, port, options);
	}

	var self = this;
	
	events.EventEmitter.call(this);
	
	options = this.options = options || {}

	if (options.window_size) {
		this.on ( "DO_WINDOW_SIZE", function() {
			self.sendWindowSize ( options.window_size[0], options.window_size[1] );
		})
	}
		
	this.encoding = "ascii";
	this.echo = false;
	
	this.receiveBuffer = "";
	this.expectList = options.expect || [];
	this.expecting = this.expectList.shift();
	
	this.connection = net.connect (port, host);
	
		
	this.connection.on ( "connect", function() {
		self.emit ( "connect" );
	});
	
	this.connection.on ( "data", function (data) { self.onData(data); } );	
	
}
sys.inherits(TelnetSession, events.EventEmitter);

TelnetSession.prototype.sendWindowSize  = function ( width, height) {
	var ws = new Buffer(4);
	ws.writeUInt16BE(width, 0)
	ws.writeUInt16BE(height, 2)
	this.sendComplexCommand ( options.WINDOW_SIZE, ws );
}

TelnetSession.prototype.sendComplexCommand  = function ( option, data ) {
	var command = new Buffer(5 + data.length);	
	command.writeUInt8 ( commands.IAC, 0)
	command.writeUInt8 ( commands.SB, 1)
	command.writeUInt8 ( option, 2)
	command.write ( data.toString('binary'), 3 )
	command.writeUInt8 ( commands.IAC, data.length + 3)
	command.writeUInt8 ( commands.SE,  data.length + 4)
	this.write ( command );
}

TelnetSession.prototype.sendSimpleCommand = function (command, option) {
	var command = new Buffer(3);
	command.writeUInt8 ( commands.IAC, 0)
	command.writeUInt8 ( command, 1)
	command.writeUInt8 ( option, 2)
	session.write ( command );	
}

TelnetSession.prototype.onData = function(data) {
	this.receiveBuffer += data.toString ( this.encoding );
	//console.log ("READ:", data)
	var i = 0;
	while (i < data.length) {
		if (data[i] == commands.IAC) {
			var commandName = commands[data[i+1]];
			var option = options[data[i+2]] || data[i+2], optionN = data[i+2];
			if ( data[i+1] == commands.SB ) {
				i += 2;
				var subParams = "";
				while ( data[i] !== commands.IAC && data[i+1] !== commands.SE && i < data.length ) {
					subParams += String.fromCharCode (data[i]);
					i++;
				}
				this.emit ( "SUB", optionN, option, new buffer(subParams) )
				i+= 2;
			} else if (commandName) {													
				if (option)	this[ commandName + '_' + option ] = true;
				this[commandName + '_' + data[i+2] ] = true;
				this.emit ( commandName, data[i+2], option );				
				this.emit ( commandName + "_" + option );
				i+=3;
			}
			console.log ( commandName, option );			
		} else 
			i++;
	}

	if (this.echo)
		console.log ( data.toString ( "utf8") );
	
	if (this.expecting && this.expecting.check(this.receiveBuffer)) {
		var buff = this.receiveBuffer;
		this.receiveBuffer = "";
		this.expecting.callback.call (this.expecting, this, buff);
		this.receiveBuffer = this.expecting.remainder;
		this.expecting = this.expectList.shift();
	}	
}

TelnetSession.prototype.expect = function( e ) {
	this.expectList.push (e);	
	if (!this.expecting) {
		this.expecting = this.expectList.shift();
	}
	this.onData ( new Buffer(0) );
}

TelnetSession.prototype.write = function (data) {
	//console.log ( "WRITE:", data );
	this.connection.write ( data );
}

TelnetSession.prototype.close = function (data) {
	this.connection.end ( data );
}

function Expect(match, callback) {
	if (false === (this instanceof Expect)) {
		return new Expect(match, callback);
	}
	this.match = match;
	this.callback = callback;
}

Expect.prototype.check = function(buffer) {
	if (this.match.test (buffer)) {
		this.result = buffer.match ( this.match );
		this.remainder = buffer.slice ( this.result.index + this.result[0].length );
		return true;
	}
}

exports.TelnetSession = TelnetSession;
exports.Expect = Expect;