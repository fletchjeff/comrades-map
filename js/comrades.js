String.prototype.toHHMMSS = function() {
	var sec_num = parseInt(this, 10); // don't forget the second param
	var hours = Math.floor(sec_num / 3600);
	var minutes = Math.floor((sec_num - (hours * 3600)) / 60);
	var seconds = sec_num - (hours * 3600) - (minutes * 60);

	if (hours < 10) {
		hours = "0" + hours;
	}
	if (minutes < 10) {
		minutes = "0" + minutes;
	}
	if (seconds < 10) {
		seconds = "0" + seconds;
	}
	var time = hours + ':' + minutes + ':' + seconds;
	return time;
};

function interval(func, wait, times) {

	d3.select(".start_text").attr("style", "display:none;");
	d3.select("#start_form").attr("style", "visibility:hidden;");
	var interv = function(w, t) {
		return function() {
			if (typeof t === "undefined" || t-- > 0) {
				setTimeout(interv, w);
				try {
					func.call(null);
				} catch (e) {
					t = 0;
					throw e.toString();
				}
			} else {
				d3.select(".start_text").attr("style", "display:block;");
				d3.select("#start_form").attr("style", "visibility:visible;");
				time = 0;
			}
		};
	}(wait, times);

	setTimeout(interv, wait);
}


function pace_calc(time_string) {
	return course_distance / ((+time_string.split(":")[0]) * 60 * 60 + (+time_string.split(":")[1]) * 60 + (+time_string.split(":")[2]));
}

function change_scale(new_scale, scale_this) {
	d3.selectAll(".scale_text").attr("fill", "#000");
	d3.select(scale_this).attr("fill", "#E1B500");
	if (new_scale == "power") {
		y = y_pow;

		d3.select(".yaxis").remove();
		yAxis = d3.svg.axis()
			.scale(y)
			.ticks(10)
			.tickSize(900)
			.orient("right");

		svg.insert("g","image")
			.attr("class", "axis yaxis")
			.attr("transform", "translate(0," + top_padding + ")")
			.call(yAxis)
			.call(customAxis);
		

	}
	else {
		y = y_lin;
		d3.select(".yaxis").remove();
		yAxis = d3.svg.axis()
			.scale(y)
			.ticks(10)
			.tickSize(900)
			.orient("right");

		svg.insert("g","image")
			.attr("class", "axis yaxis")
			.attr("transform", "translate(0," + top_padding + ")")
			.call(yAxis)
			.call(customAxis);		
	}
}

function change_selector(new_selector, selector_this) {
	d3.selectAll(".select_text").attr("fill", "#000");
	d3.select(selector_this).attr("fill", "#E1B500");
	single_runner.attr("style", "display:none;");
	if (new_selector == "none") {
		selector = "gender";
		selection = "X";
	}
	else if (new_selector == "male") {
		selector = "gender";
		selection = "M";
	} else if (new_selector == "female") {
		selector = "gender";
		selection = "F";
	} else if (new_selector == "senior") {
		selector = "catagory";
		selection = "SEN";
	} else if (new_selector == "vetran") {
		selector = "catagory";
		selection = "VET";
	} else if (new_selector == "senior") {
		selector = "catagory";
		selection = "SEN";
	} else if (new_selector == "master") {
		selector = "catagory";
		selection = "MAS";
	} else if (new_selector == "grand master") {
		selector = "catagory";
		selection = "GM";
	} else if (new_selector == "race number") {
		if (typeof line_selection !== "undefined") {
			line_selection.remove();
		}
		single_runner.attr("style", "display:block;");
		selector = "race_num";
		d3.select("#race_num").attr("fill", "#E1B500").text("race number #" + race_number);
		selection = race_number;
	}
	results_data_selection = _.filter(results_data, function(d) {
		if (d[selector] == selection) {
			return true;
		} else {
			return false;
		}
	});
}

function draw_hist(hist_data, hist_data_selection) {

	line = line_g.selectAll(".moving_lines").data(hist_data);

	line.enter().append("line")
		.attr("class", "moving_lines");

	line
		.attr("y1", function(d) {
			return Math.floor(y(0)) + top_padding;
		})
		.attr("x1", function(d) {
			return x(d.x);
		})
		.attr("x2", function(d) {
			return x(d.x);
		})
		.attr("y2", function(d) {
			if (d.y === 0) {
				return Math.floor(y(0)) + top_padding;
			} else {
				return Math.ceil(y(d.y)) + top_padding - 1;
			}
		});

	line.exit().remove();

	if (selector == "race_num") {
		single_runner.datum(_.filter(hist_data_selection, function(d) {
			if (d.y == 1) {
				return true;
			} else {
				return false;
			}
		}));

		single_runner
			.transition()
			.duration(50)
			.ease("linear")
			.attr("cx", function(d) {
				return x(d[0].x);
			});
	} else {

		line_selection = line_g.selectAll(".moving_lines_selection")
			.data(hist_data_selection);

		line_selection.enter().append("line")
			.attr("class", "moving_lines_selection");

		line_selection
			.attr("y1", function(d) {
				return Math.floor(y(0)) + top_padding;
			})
			.attr("x1", function(d) {
				return x(d.x);
			})
			.attr("x2", function(d) {
				return x(d.x);
			})
			.attr("y2", function(d) {
				if (d.y === 0) {
					return y(0) + top_padding;
				} else {
					return Math.ceil(y(d.y)) + top_padding - 1;
				}
			});
		line_selection.exit().remove();
	}
}

function calc_plus_draw_hist() {

	hist_data = d3.layout.histogram().range([0, 90000]).value(function(d) {
		return pace_calc(d.time) * (time);
	}).bins(900)(results_data);

	hist_data_selection = d3.layout.histogram().range([0, 90000]).value(function(d) {
		return pace_calc(d.time) * (time);
	}).bins(900)(results_data_selection);

	draw_hist(hist_data, hist_data_selection);

	if (time >= 43200) {
		timer_svg.text("12:00:00");
	} else {
		timer_svg.text(time.toString().toHHMMSS());
	}
	time += 100;
}

function customAxis(g) {
	g.selectAll("text")
		.attr("x", 4)
		.attr("dy", -4);
}

var time = 100;

var selection = "X";

var selector = "gender";

var race_number = 46216;

var course_distance = 90000;

var top_padding = 100;

var width = 960,
	height = 600;

var start_fin_path = "M0 0.75 L42.44 0.75 L52.87 7.47 L42.83 13.93 L0 13.93 L0 0.75 Z";

var svg = d3.select("body").append("svg")
	.attr("width", width)
	.attr("height", height -100)
	.attr("transform", "translate(2,0)");

var x = d3.scale.linear()
	.domain([0, 90000])
	.range([0, 900])
	.clamp(true);

var y_lin = d3.scale.linear()
.domain([0, 2000])
	.range([height - 300, 0])
	.clamp(true);

var y_pow = d3.scale.pow().exponent(0.4)
.domain([0, 2000])
	.range([height - 300, 0])
	.clamp(true);

var y = y_lin;

var yAxis = d3.svg.axis()
	.scale(y)
	.ticks(10)
	.tickSize(900)
	.orient("right");

var xAxis = d3.svg.axis()
	.scale(x)
	.ticks(10)
	.tickFormat(function(d) {
		return (+d / 1000) + "km";
	})
//.tickSize(900)
.orient("bottom");

svg.append("g")
	.attr("class", "axis yaxis")
	.attr("transform", "translate(0," + top_padding + ")")
	.call(yAxis)
	.call(customAxis);

svg.append("g")
	.attr("class", "axis xaxis")
	.attr("transform", "translate(0," + (height - 300 + top_padding) + ")")
	.call(xAxis);

svg.append("image")
	.attr("x", 0)
	.attr("y", height - 510 + top_padding)
	.attr("width", 900)
	.attr("height", 212)
	.attr("style", "opacity:0.4;")
	.attr("xlink:href", "images/ComradesUpRoute.png");

svg.append("image")
	.attr("x", 850)
	.attr("y", height - 265 + top_padding)
	.attr("width", 36)
	.attr("height", 21)
	.attr("style","cursor:pointer")
	.attr("xlink:href", "images/mini-limn.png")
	.on("click", function () {
		return window.open("http://www.limn.co.za");
	});

svg.append("image")
	.attr("x", 770)
	.attr("y", height - 270 + top_padding)
	.attr("width", 60)
	.attr("height", 26)
	.attr("style","cursor:pointer")
	.attr("xlink:href", "images/IS-mini-logo.png")
	.on("click", function () {
		return window.open("http://www.is.co.za");
	});


svg.append("text")
	.attr("x", 25)
	.attr("y", height - 250 + top_padding)
	.attr("class", "warn_text")
	.text("Please note that this runs very slowly on Firefox. Much better on Google Chrome");

//.call(customAxis);	

svg.append("rect")
	.attr("x", 0.5)
	.attr("y", height - 294.5 + top_padding)
	.attr("rx", 0)
	.attr("ry", 0)
	.attr("width", 40)
	.attr("height", 14)
	.attr("class", "start_fin_path");


svg.append("text")
	.attr("x", 5)
	.attr("y", height - 284 + top_padding)
	.attr("class", "start_fin_text")
	.text("START");

svg.append("text")
	.attr("x", 20)
	.attr("y", 70)
	.attr("class", "no_pointer scale_text")
	.text("Scale:");

svg.append("text")
	.attr("x", 90)
	.attr("y", 70)
	.attr("class", "scale_text")
	.attr("fill", "#E1B500")
	.text("linear")	
	.on("click", function() {
		return change_scale("linear", this);
	});

svg.append("text")
	.attr("x", 150)
	.attr("y", 70)
	.attr("class", "scale_text")
	.text("power")
	.on("click", function() {
		return change_scale("power", this);
	});

svg.append("text")
	.attr("x", 300)
	.attr("y", 120 + top_padding)
	.attr("class", "start_text")
	.text("Click here to start")
	.on("click", function() {
		return interval(calc_plus_draw_hist, 100, 432);
	});

var selector_g = svg.append("g");
//.attr("transform","translate(-100,0)");

selector_g.append("text")
	.attr("x", 20)
	.attr("y", 30)
	.attr("class", "no_pointer select_text")
	.attr("fill", "#000")
	.text("Show:");

selector_g.append("text")
	.attr("x", 90)
	.attr("y", 30)
	.attr("class", "select_text")
	.attr("fill", "#E1B500")
	.text("none")
	.on("click", function() {
		return change_selector("none", this);
	});

selector_g.append("text")
	.attr("x", 150)
	.attr("y", 30)
	.attr("class", "select_text")
	.attr("fill", "#000")
	.text("male")
	.on("click", function() {
		return change_selector("male", this);
	});

selector_g.append("text")
	.attr("x", 210)
	.attr("y", 30)
	.attr("class", "select_text")
	.text("female")
	.on("click", function() {
		return change_selector("female", this);
	});

selector_g.append("text")
	.attr("x", 286)
	.attr("y", 30)
	.attr("class", "select_text")
	.text("senior").on("click", function() {
		return change_selector("senior", this);
	});

selector_g.append("text")
	.attr("x", 357)
	.attr("y", 30)
	.attr("class", "select_text")
	.text("veteran")
	.on("click", function() {
		return change_selector("vetran", this);
	});

selector_g.append("text")
	.attr("x", 440)
	.attr("y", 30)
	.attr("class", "select_text")
	.text("master")
	.on("click", function() {
		return change_selector("master", this);
	});

selector_g.append("text")
	.attr("x", 519)
	.attr("y", 30)
	.attr("class", "select_text")
	.text("grand master")
	.on("click", function() {
		return change_selector("grand master", this);
	});

selector_g.append("text")
	.attr("x", 660)
	.attr("y", 30)
	.attr("class", "select_text")
	.text("race number #46216")
	.attr("id", "race_num")
	.on("click", function() {
		return change_selector("race number", this);
	});

svg.append("rect")
	.attr("x", 700.5)
	.attr("y", top_padding + 15)
	.attr("rx", 2)
	.attr("ry", 2)
	.attr("width", 150)
	.attr("height", 50)
	.attr("class", "start_box");

var timer_svg = svg.append("text")
	.attr("x", 740)
	.attr("y", top_padding + 45)
	.attr("class", "time_text")
	.text("00:00:00");

var line_g = svg.append("g");

single_runner = svg.append("circle")
	.attr("cx", 2)
	.attr("cy", height - 300 + top_padding)
	.attr("r", 5)
	.attr("style", "display:none;")
	.attr("class", "single_runner");

d3.csv("data/results.csv", function(d) {

	$("#race_num_input").keyup(function(e) {
		if (e.keyCode == 13) {
			//$("#race_num_input").val("");
			var number_check = _.find(results_data, function(d) {
				if (d.race_num == $("#race_num_input").val()) {
					return true;
				}
			});
			if (typeof number_check !== 'undefined') {
				race_number = number_check.race_num;
				$("#race_num_input").val("");
				$("#race_num_response").text("Valid number.");
				setTimeout(function() {
					$("#race_num_response").text("");
				}, 5000);
				d3.select("#race_num").text("race number #" + race_number);
				results_data_selection = _.filter(results_data, function(d) {
					if (d.race_num == race_number) {
						return true;
					} else {
						return false;
					}
				});
			} else {
				$("#race_num_response").text("Invalid number, please try again.");
				//setTimeout(function() {$("#race_num_response").text("")},5000);				
			}
		}
	});

	results_data = d;

	results_data_selection = _.filter(results_data, function(d) {
		if (d[selector] == selection) {
			return true;
		} else {
			return false;
		}
	});

});