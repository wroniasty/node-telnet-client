exports = module.exports;

exports.Command = {
		SE : 240, NOP : 241, DM : 242, BRK : 243,
		IP : 244, AO : 245, AYT : 246, EC : 247, 
		EL : 248, GA : 249, SB : 250, 
		WILL : 251, WONT : 252, DO : 253, DONT : 254, IAC : 255
};

for (cId in exports.Command) exports.Command[exports.Command[cId]] = cId;


exports.options = {
		1 : "ECHO",
		3 : "SUPRESS_GO_AHEAD",
		5 : "STATUS",
		6 : "TIMING_MARK",
		24 : "TERMINAL_TYPE",
		31 : "WINDOW_SIZE",
		32 : "TERMINAL_SPEED",
		33 : "REMOTE_FLOW_CONTROL",
		34 : "LINEMODE",
		36 : "ENVIRONMENT_VARIABLES"		
};

for (optionId in exports.options) exports.options[exports.options[optionId]] = parseInt(optionId);


