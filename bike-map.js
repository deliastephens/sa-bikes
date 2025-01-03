// Constants for configuration
const DEFAULT_CENTER = { lat: 29.424349, lng: -98.491142 }; // San Antonio
const DEFAULT_ZOOM = 10;
const POLYLINE_DEFAULTS = {
    geodesic: true,
    strokeOpacity: 1.0,
    strokeWeight: 3
};

class GPXMapViewer {
    constructor() {
        this.map = null;
        this.bounds = null;
        this.polylines = new Map(); // Store polyline references by GPX file name
        this.fileColors = new Map(); // Store colors for each GPX file
    }

    async initialize() {
        try {
            const { Map } = await google.maps.importLibrary("maps");
            const { LatLngBounds } = await google.maps.importLibrary("core");

            this.map = new Map(document.getElementById("map"), {
                center: DEFAULT_CENTER,
                zoom: DEFAULT_ZOOM,
            });
            
            this.bounds = new LatLngBounds();
            this.attachEventListeners();
        } catch (error) {
            console.error('Failed to initialize map:', error);
            this.showError('Failed to load map. Please try refreshing the page.');
        }
    }

    attachEventListeners() {
        document.querySelectorAll(".gpx-card").forEach(item => {
            item.addEventListener("click", () => {
                const file = item.getAttribute("data-file");
                if (!file) {
                    console.error('No file attribute found on GPX card');
                    return;
                }
                this.toggleGPX(file, item);
            });
        });
    }

    async toggleGPX(file, element) {
        if (this.polylines.has(file)) {
            this.removeGPXFromMap(file, element);
        } else {
            await this.loadGPX(file, element);
        }
    }

    removeGPXFromMap(file, element) {
        const polyline = this.polylines.get(file);
        polyline.setMap(null);
        this.polylines.delete(file);
        this.updateElementStyle(element, false);
        this.updateBounds();
    }

    async loadGPX(file, element) {
        try {
            const response = await fetch(file);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const gpxText = await response.text();
            const coordinates = this.parseGPX(gpxText);
            
            if (coordinates.length === 0) {
                throw new Error('No valid coordinates found in GPX file');
            }

            this.displayTrack(coordinates, file, element);
        } catch (error) {
            console.error('Error loading GPX file:', error);
            this.showError(`Failed to load GPX file: ${file}`);
        }
    }

    parseGPX(gpxText) {
        const parser = new DOMParser();
        const gpx = parser.parseFromString(gpxText, "application/xml");
        const coordinates = [];

        if (gpx.documentElement.nodeName === "parsererror") {
            throw new Error('Invalid GPX file format');
        }

        const trackpoints = gpx.querySelectorAll("trkpt");
        trackpoints.forEach(point => {
            const lat = parseFloat(point.getAttribute("lat"));
            const lon = parseFloat(point.getAttribute("lon"));
            
            if (!isNaN(lat) && !isNaN(lon)) {
                const latLng = { lat, lng: lon };
                coordinates.push(latLng);
                this.bounds.extend(latLng);
            }
        });

        return coordinates;
    }

    displayTrack(coordinates, file, element) {
        if (!this.fileColors.has(file)) {
            this.fileColors.set(file, this.getRandomColor());
        }
        
        const color = this.fileColors.get(file);
        const polyline = new google.maps.Polyline({
            ...POLYLINE_DEFAULTS,
            path: coordinates,
            strokeColor: color,
        });

        polyline.setMap(this.map);
        this.polylines.set(file, polyline);
        this.updateElementStyle(element, true, color);
        this.map.fitBounds(this.bounds);
    }

    updateElementStyle(element, isSelected, color = null) {
        element.style.color = isSelected ? "black" : "blue";
        element.style.backgroundColor = isSelected ? color : "transparent";
    }

    updateBounds() {
        this.bounds = new google.maps.LatLngBounds();
        
        this.polylines.forEach(polyline => {
            polyline.getPath().forEach(point => this.bounds.extend(point));
        });

        if (!this.bounds.isEmpty()) {
            this.map.fitBounds(this.bounds);
        } else {
            // Reset to default view if no tracks are visible
            this.map.setCenter(DEFAULT_CENTER);
            this.map.setZoom(DEFAULT_ZOOM);
        }
    }

    getRandomColor() {
        const randomInt = (min, max) => 
            Math.floor(Math.random() * (max - min + 1)) + min;

        // Generate hue, excluding greens
        let h;
        if (Math.random() < 0.5) {
            h = randomInt(0, 60);
        } else {
            h = randomInt(180, 360);
        }
        
        const s = randomInt(50, 65);
        const l = randomInt(65, 75);
        return `hsl(${h},${s}%,${l}%)`;
    }

    showError(message) {
        // You can implement this based on your UI needs
        alert(message);
    }
}

// Initialize the map viewer
const mapViewer = new GPXMapViewer();
mapViewer.initialize();
