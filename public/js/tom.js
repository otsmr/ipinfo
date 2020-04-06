function jumpTo(lon, lat, zoom) {
    var x = Lon2Merc(lon);
    var y = Lat2Merc(lat);
    map.setCenter(new OpenLayers.LonLat(x, y), zoom);
    return false;
}

function Lon2Merc(lon) {
    return 20037508.34 * lon / 180;
}

function Lat2Merc(lat) {
    var PI = 3.14159265358979323846;
    lat = Math.log(Math.tan( (90 + lat) * PI / 360)) / (PI / 180);
    return 20037508.34 * lat / 180;
}

function addMarker(lon, lat) {

    const lonLat = new OpenLayers.LonLat( lon ,lat )
    .transform(
        new OpenLayers.Projection("EPSG:4326"),
        map.getProjectionObject()
    );

    const markers = new OpenLayers.Layer.Markers("Markers");
    map.addLayer(markers);
    
    markers.addMarker(new OpenLayers.Marker(lonLat));

}