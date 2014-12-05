// ++
// ++ js for Map Analysis Tool
// ++

$(document).ready(function(){

	var s = {
		country:"",
		continent:"",
		adm:"",
		adm_alt:"",
		type:"",
		start_year:2005,
		end_year:2010,
		rasters:[],
		weights:[],
		files:[],
		id:""
	}

	// --------------------------------------------------
	// build options

	$('#country').val('-----')
	$('#adm').val('-----')

	$('#country').on('change', function(){
		
		var $blank = $('#blank_country_option')
		if ($blank.length){ 
			$blank.remove() 
		}

		s.country = $(this).val()

		switch (s.country){
			case "Nepal":
				s.continent = "Asia"
				break
			case "Uganda":
			case "Malawi":
				s.continent = "Africa"
				break
		}

		addCountry()

		if (s.type != ""){
			addPointData()
		}

		buildRasterList()

		console.log(s)

	})

	$('#adm').on('change', function(){

		var $blank = $('#blank_adm_option')
		if ($blank.length){ 
			$blank.remove() 
		}

		s.adm = $(this).val()
		s.adm_alt = "__"+s.adm.substr(3) +"_"

		buildRasterList()
	})

	$('#raster_add').click(function(){
		var vals=$('#raster_available_list').val()
		
		if (vals == null){ return }

		for (var i=0; i<vals.length;i++){
			s.rasters.push(vals[i])
			s.weights.push(1)
			s.files.push($('#'+vals[i]).attr("data-file"))
			newHTML = "<tr><td><input type='checkbox'></input></td><td><span>"+vals[i]+"</span></td><td><input type='number' value=1></input></td></tr>"
			$('#raster_selected_list tbody').append(newHTML)
			$('#'+vals[i]).remove()
		}
		console.log(s)
	})

	$('#raster_remove').click(function(){
		$('tr').each(function(){
			if ( $(this).children(':nth-child(1)').children(':nth-child(1)').prop("checked") ){
				var item = $(this).children(':nth-child(2)').text()
				var index = s.rasters.indexOf(item)
				s.rasters.splice(index,1)
				s.weights.splice(index,1)
				s.files.splice(index,1)
				$(this).remove()
				addOptionToGroup(item)
			}
		})
	})

	$('#submit').click(function(){
		$('#build_options').slideUp("slow", function(){
			$('#build_toggle').slideDown()
			setTimeout(function(){ 

				// generate unique id
				s.id = s.country +"_"+ s.adm
				for (var i=0; i<s.rasters.length; i++){
					s.id += "_" + s.rasters[i] +"_"+ s.weights[i]
				}

				console.log(s)
				// TEMP
				$('#ndvi').click()
		 	
		 	}, 1000)
 
		})
	})

	$('#build_toggle').click(function(){
		$('#build_options').slideToggle()
	})


	function buildRasterList(){
		if (s.continent != "" && s.country != "" && s.adm != ""){

			// init
			$('#raster_available_list').empty()
			$('#raster_selected_list tbody').empty()
			s.rasters = []
			s.weights = []
			
			// build
			process({ type: "scan", path: "/"+s.continent.toLowerCase().toLowerCase()+"/"+s.country.toLowerCase()+"/cache" }, function(options) {
					var op_count = 0
				    for (var op in options){
				    	if (options[op].indexOf(s.adm) != -1 || options[op].indexOf(s.adm_alt) != -1){
				    			option = filterOptionName(options[op], "__", 4, 4)
				    			addOptionToGroup(option, options[op])
				    			op_count ++
				    	}
				    }
				    if (op_count == 0){
   						$('#raster_available_list').append('<option class="no-data">No Data Available</option>')
   						$('#raster_available_list').prop('disabled', true)
				    } else {
				    	$('#raster_available_list').prop('disabled', false)
				    }
		    })
		}
	}

	//option = string, m = search char, n = nth occurence, p = offset from end of string
	function filterOptionName(option, m, n, p = 0){
		var i = 0, index = null, offset = 0

		while (i < n && index != -1){
			index = option.indexOf(m, index+m.length)
			i++
		}

		if (index == -1){
			return option
		}
		
		if (m.length > 0){ offset = m.length }
		var end = option.substr(index+offset).length - p
		return option.substr(index+offset, end)
	}

	function addOptionToGroup(option, file){
    	var type = option.substr(0,option.indexOf("__"))

    	if ( !$("#optgroup_"+type).length ){
    		$("#raster_available_list").append('<optgroup id="optgroup_'+type+'" label="'+type+'"></optgroup>')
    	}
	        
        $("#optgroup_"+type).append('<option id="'+option+'" value="' + option + '" data-file="'+file+'">' + option + '</option>')   
	}


	// --------------------------------------------------
	// point data options

	$("#ndvi").on("click", function(){
		onExtract = true
		prepExtract("nepal") // COUNTRY REF
	})


	$(".menu_item").click(function(){
		if (s.country == ""){return}
		
		$(this).siblings().removeClass("active_menu")
		$(this).addClass("active_menu")
	})

	$("#data_type ul li").on("click", function(){
		if (s.country == ""){ return }

		onPoint = true
		s.type = $(this).attr("id")
		addPointData()
	
	})

	$('#slider').dragslider({
		animate: true,
		range: true,
		rangeDrag: true,
		min:2001,
		max:2013,
		step: 1,
		values: [s.start_year, s.end_year]
	}); 
 	
    var v = $("#slider").dragslider("values")
    $('#slider_value').text(v[0]+" - "+v[1]);
    var min = $('#slider').dragslider('option', 'min')
    var max = $('#slider').dragslider('option', 'max')
    $('#slider_min').text(min);
    $('#slider_max').text(max);

    var onPoint = false
    var onExtract = false
    $('#slider').dragslider({
    	slide: function(event, ui) {
	    	v = ui.values
	        $('#slider_value').text(v[0]+" - "+v[1]);
	   	},
    	change: function(event, ui) {
	        s.start_year = $("#slider").dragslider("values")[0]
	    	s.end_year = $("#slider").dragslider("values")[1]
	        if (onPoint){ addPointData() }
	        if (onExtract){ prepExtract("nepal")} // COUNTRY REF
    	}
    });

	// --------------------------------------------------
	// map

	L.mapbox.accessToken = 'pk.eyJ1Ijoic2dvb2RtIiwiYSI6InotZ3EzZFkifQ.s306QpxfiAngAwxzRi2gWg'

	var map = L.mapbox.map('map', {})

	var tiles = L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
				attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap contributors</a>'
			}).addTo(map)

	map.setView([0,0], 1);

	map.options.maxZoom = 11


	var allCountryBounds = { global:{_northEast:{lat:90, lng:180}, _southWest:{lat:-90, lng:-180}} }


	var countryLayer 

	function addCountry(){
		var file = "/aiddata/DET/resources/"+s.continent.toLowerCase()+"/"+s.country.toLowerCase()+"/shapefiles/Leaflet.geojson"
		var geojsonFeature = readJSON(file)
		if (map.hasLayer(countryLayer)){
			map.removeLayer(countryLayer)
		}
		countryLayer = L.geoJson(geojsonFeature, {style: style}).addTo(map);
		var countryBounds = countryLayer.getBounds()
		map.fitBounds( countryBounds )

		allCountryBounds[s.country] = countryBounds
		
		function style(feature) {
		    return {
		        fillColor: 'red', // ### HERE ###
		        weight: 1,
		        opacity: 1,
		        color: 'black',
		        fillOpacity: 0.25
		    };
		}

	}


	var markers,
		geojsonPoints
	
	function addPointData(){

		if (map.hasLayer(markers)){
			map.removeLayer(markers)
		}

		$.ajax ({
	        url: "process.php",
	        data: {type: "addPointData", country:s.country, pointType: s.type, start_year:s.start_year, end_year:s.end_year},
	        dataType: "json",
	        type: "post",
	        async: false,
	        success: function(geojsonContents) {
				
				geojsonPoints = geojsonContents

				markers = new L.MarkerClusterGroup({
					disableClusteringAtZoom: 10//8
				});

				var geojsonLayer = L.geoJson(geojsonContents, {
					onEachFeature: function (feature, layer) {
						var a = feature.properties

						var popup = "PLACEHOLDER"
						// var popup = "<b>"+a.placename+"</b>";
						// popup += "</br>Region: " + a.R_NAME
						// popup += "</br>Zone: " + a.Z_NAME
						// popup += "</br>District: " + a.D_NAME
						// popup += "</br>Project Start: " + a.actual_start_date
						// popup += "</br>Years: "
						// var c = 0
						// for (var y = start_year; y<=end_year; y++){
						// 	if ( parseFloat(a["d_"+y]) > 0 ){
						// 		if (c>0){ popup += ", "}
						// 		popup += y
						// 		c++							
						// 	}
						// }
						// popup += "</br>$USD: "
						// c = 0
						// for (var y = start_year; y<=end_year; y++){
						// 	if ( parseFloat(a["d_"+y]) > 0 ){
						// 		if (c>0){ popup += ", "}
						// 		popup += a["d_"+y]
						// 		c++							
						// 	}
						// }
						// popup += "</br>Donors: " + a.donors

						layer.bindPopup(popup);
					},
					pointToLayer: function(feature, latlng) {
				        return L.marker(latlng, {
				            // radius: 5
				        })
				    }
				});

				markers.addLayer(geojsonLayer);
				map.addLayer(markers);

	        }
	    })

	}

	function prepExtract(country){

		$.ajax ({
	        url: "process.php",
	        data: {type: "buildPolyData", country: s.country, start_year: s.start_year, end_year: s.end_year, name:s.id},
	        dataType: "text",
	        type: "post",
	        async: false,
	        success: function(result) {
	        	addGeoExtract("rcalc/output/output_"+s.start_year+"_"+s.end_year+".geojson")
	        }
	    })

	}


	var geojson,
		info,
		legend,
		rasterLayer

	function addGeoExtract(file){

		if (map.hasLayer(geojson)){
			map.removeLayer(geojson)
			info.removeFrom(map)
			legend.removeFrom(map)

			map.removeLayer(countryLayer)
		}

		var geojsonFeature = readJSON(file)
		
		function getColor(d) { // ### HERE ###

		    return d <= -1.5 ? '#de2d26' :
		           d <= -1.0 ? '#fc9272' :
		           d <= -0.5 ? '#fee0d2' :

		           d <= 0.5 ? '#fff7bc' :
		           d <= 1.0 ? '#e5f5e0' :
   		           d <= 1.5 ? '#a1d99b' :
   		           			  '#31a354';
		}

		function style(feature) {
		    return {
		        fillColor: getColor(feature.properties.sd), // ### HERE ###
		        weight: 1,
		        opacity: 1,
		        color: 'black',
		        fillOpacity: 0.75
		    };
		}

		function highlightFeature(e) {
		    var layer = e.target;

		    layer.setStyle({
		        weight: 5,
		        color: '#666',
		        dashArray: '',
		        fillOpacity: 0.7
		    });

		    if (!L.Browser.ie && !L.Browser.opera) {
		        layer.bringToFront();
		    }

   		    info.update(e.target.feature.properties);

		}

		function resetHighlight(e) {
		    geojson.resetStyle(e.target);
		    info.update();
		}

		function zoomToFeature(e) {
	    	// map.fitBounds(e.target.getBounds());
		}

		function onEachFeature(feature, layer) {
		    layer.on({
		        mouseover: highlightFeature,
		        mouseout: resetHighlight,
		        click: zoomToFeature
		    });
		}

		geojson = L.geoJson(geojsonFeature, {
		    style: style,
		    onEachFeature: onEachFeature
		})

		map.addLayer(geojson, true);

		map.fitBounds( geojson.getBounds() )


		info = L.control();

		info.onAdd = function (map) {
		    this._div = L.DomUtil.create('div', 'info'); // create a div with a class "info"
		    this.update();
		    return this._div;
		};

		// method that we will use to update the control based on feature properties passed
		info.update = function (props) {
		    this._div.innerHTML = '<h4>Potential Agricultural Productivity (2001)</h4>' +  (props ?
		        '<b>' + props.NAME_2 + '</b><br />' 
		        + 'sd: ' + roundx(props.sd) + '<br>'
		        + '%$ - %ndvi: ' + roundx(props.ratio) + '<br>'
		        + 'Aid:  ' + roundx(props.sum) + ' $ USD<br>'
		        + 'NDVI: ' + roundx(props.ndvi) 
		        : 'Hover over an area');
		};

		info.addTo(map);

		function roundx(x){
			return Math.floor(x*1000)/(1000)
		}

		//manage legend
		legend = L.control({position: 'bottomright'});

		legend.onAdd = function (map) {

		    var div = L.DomUtil.create('div', 'info legend'),

		        grades = [-1.5, -1.0, -0.5, 0.5, 1.0, 1.5, 2], // ### HERE ###
		        labels = [];

		    // loop through our density intervals and generate a label with a colored square for each interval
		    for (var i = 0; i < grades.length; i++) {
		        div.innerHTML += '<i style="background:' + getColor(grades[i]) + '"></i> '
		        // if (!grades[i-1]){
		        // 	div.innerHTML += "< " + grades[i]  + '<br>'
		        // } else if (!grades[i+1]){
		        // 	div.innerHTML += "> " + grades[i]  + '<br>'
		        // } else {
		        // 	div.innerHTML += grades[i] + '&ndash;' + grades[i + 1] + '<br>'
		        // }
		        if (!grades[i+1]){
		        	div.innerHTML += grades[i-1]  + '+<br>'
		        } else {
		        	div.innerHTML += "<= " + grades[i]  + '<br>'
		        }
		    }
		    return div;
		};

		legend.addTo(map);

	}

	// --------------------------------------------------
	// general functions

	//generic ajax call to process.php
	function process(data, callback){
		$.ajax ({
	        url: "process.php",
	        data: data,
	        dataType: "json",
	        type: "post",
	        async: false,
	        success: function(result) {
			    callback(result)
			}
	    })
	}

	//read in a json file and return object
	function readJSON(file) {
	    var request = $.ajax({
	    	type: "GET",
			dataType: "json",
			url: file,
			async: false,
	    })
	    return request.responseJSON
	};


})


	