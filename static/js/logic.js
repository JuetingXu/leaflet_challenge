async function main() 
{
    const featureCollection = [];
    const map = L.map("map", {
      center: [37.0902, -95.7129],
      zoom: 5
    });
  
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    const url = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson"

    const response =  await fetch(url);
    const data = await response.json();
    
    console.log(data.features.length);

    function getFillColorByGivenDepth(earthquake_depth) 
    {
        result = '';
        
        let lime_green         = "#00FF00"; //-10-10
        let light_green_yellow = "#C7E50C"; //10-30
        let light_orange       = "#E5C20C"; //30-50
        let orange             = "#E5900C"; //50-70
        let light_brown        = "#E56B0C"; //70-90
        let red                = "#FF0000"; //90+

        if(earthquake_depth <= 10)
            result = lime_green;
        else if(earthquake_depth <= 30)
            result = light_green_yellow;
        else if(earthquake_depth <= 50)
            result = light_orange;
        else if(earthquake_depth <= 70)
            result = orange;
        else if(earthquake_depth <= 90)
            result = light_brown;  
        else
            result = red;  

        return result;
    }

    function buildGeoJsonFeature(longitude,
                                 latitude,
                                 magnitude,
                                 depth,
                                 location,
                                 idx)
    {
        let feature_dict     = {};
        let properties_dict  = {};
        let coordinates_dict = {};

        feature_dict['type'] = "Feature";
        feature_dict['id']   = idx;

        coordinates_dict["type"] = "Point";
        coordinates_dict["coordinates"] = [longitude,latitude];

        properties_dict["Magnitude"] = magnitude;
        properties_dict["Location"]  = location;   
        properties_dict["Depth"]     = depth;    
     
        feature_dict['properties'] = properties_dict;
        feature_dict['geometry']   = coordinates_dict;     

        return feature_dict;
      
    }

    let geoJsonFeatures = [];
    let geoJson = {};

    for (let idx = 0; idx < data.features.length; idx++)
    {
        let feature     = data.features[idx];
        let coordinates = feature.geometry.coordinates;
        let magnitude   = feature.properties.mag;
        let location    = feature.properties.place;
        
        let longitude = coordinates[0];
        let latitude  = coordinates[1];
        let depth     = coordinates[2];

        let geoJsonFeature = buildGeoJsonFeature(longitude,
                                                 latitude,
                                                 magnitude,
                                                 depth,
                                                 location,
                                                 idx);

        geoJsonFeatures.push(geoJsonFeature);  
                                   
    }

    geoJson['type'] = "FeatureCollection";
    geoJson['features'] = geoJsonFeatures;   

    let geojsonLayer = L.geoJson(geoJson, {
                                            pointToLayer: function(feature, latlng) 
                                            {
                                                return new L.CircleMarker(latlng, 
                                                                                {
                                                                                    radius: feature.properties.Magnitude * 4, 
                                                                                    fillOpacity: 100,
                                                                                    color: '#000000',
                                                                                    weight: .25,
                                                                                });
                                            },
                                            onEachFeature: function (feature, layer) 
                                            {
                                                layer.bindPopup("Location: "  + feature.properties.Location  + "<br>" + 
                                                                "Magnitude: " + feature.properties.Magnitude + "<br>" + 
                                                                "Depth: "     + feature.properties.Depth);

                                                layer.setStyle({fillColor : getFillColorByGivenDepth(feature.properties.Depth)}) 
                                            }
                                        });

    map.addLayer(geojsonLayer);
                                
    
    let legend = L.control({position:'bottomright'});
    
    //function to populate the legend
    legend.onAdd = function(map) {
        let div    = L.DomUtil.create('div', 'info legend');
        let labels = ['<strong>Categories</strong>'];
        let categories = ['-10-10','10-30','30-50','50-70','70-90','90+'];
        let depths = [-10, 15, 40, 60, 80, 100];

        //add heading info to div
        const legendInfo = "<h3>Earthquake Depth (km)</h3>" +
            "<div class=\"labels\">" + "</div>";
        div.innerHTML = legendInfo;

        //for each interval of depths, 
        for (let i = 0; i < (categories.length); i++) {
            div.innerHTML += labels.push('<i class="circle" style="background:' + getFillColorByGivenDepth(depths[i]) + '"></i> ' + (categories[i] ? categories[i] : '+'));
        }
            div.innerHTML = labels.join('<br>');

        return div;
      };

    //add legend to map
    legend.addTo(map);

}
main();