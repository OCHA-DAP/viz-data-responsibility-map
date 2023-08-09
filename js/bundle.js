window.$ = window.jQuery = require('jquery');
$( document ).ready(function() {
  const DATA_URL = 'https://proxy.hxlstandard.org/data.objects.json?dest=data_view&url=https%3A%2F%2Fdocs.google.com%2Fspreadsheets%2Fd%2Fe%2F2PACX-1vTB0YT-fl6AaNzIHgPDZDcBEwqowRX1YAgnpGLpcsW1ciPZ6fd1Qxxcdhgla9ZxwBM2dwQq6u751xsN%2Fpub%3Fgid%3D0%26single%3Dtrue%26output%3Dcsv&force=on';
  const isMobile = $(window).width()<700? true : false;
  let data = [];

  mapboxgl.baseApiUrl='https://data.humdata.org/mapbox';
  mapboxgl.accessToken = 'cacheToken';

  function getData() {
    d3.json(DATA_URL).then(function(d) {
      //console.log(d);
      data = d.sort((a, b) => (a['#country+name'] > b['#country+name']) ? 1 : -1)

      initMap();
      // initPanel();
    });
  }

  function initMap() {
    const zoomLevel = (isMobile) ? 1.6 : 4.6;
    const minZoomLevel = (isMobile) ? 0 : 0;
    const centerPos = (isMobile) ? [20, -5] : [20, -5];

    //init mapbox
    const map = new mapboxgl.Map({
      container: 'map',
      style: 'mapbox://styles/humdata/cl3lpk27k001k15msafr9714b',//ckaoa6kf53laz1ioek5zq97qh',
      center: centerPos,
      minZoom: minZoomLevel,
      maxZoom: minZoomLevel+1,
      zoom: zoomLevel,
      attributionControl: false
    });

    // add map controls
    map.addControl(new mapboxgl.NavigationControl());
    map.scrollZoom.disable();

    map.on('load', function() {
      // create popup
      const popup = new mapboxgl.Popup({
        anchor: 'top',
        closeButton: false,
        closeOnClick: false
      });

      //init map markers
      for (const marker of data) {
        let coords = { lat: Number(marker['#geo+lat']), lon: Number(marker['#geo+lon']) };
        let typeClass = marker['#metadata+icon'];
        let statusClass = 'development';
        if (marker['#status+name'].toLowerCase().includes('revision')) statusClass = 'revision';
        else if (marker['#status+name'].toLowerCase().includes('endorsed')) statusClass = 'endorsed';

        const el = document.createElement('div');
        el.className = 'marker';
        el.style.backgroundImage = `url(https://ocha-dap.github.io/viz-data-responsibility-map/assets/markers/marker_${statusClass}.svg)`;
        el.classList.add(statusClass);
        el.classList.add(typeClass);

        el.addEventListener('mouseover', () => {
          initPanel(marker);
          //scroll to country in panel
          let element = document.getElementById(marker["#country+name"]);
          element.parentNode.scrollTop = element.offsetTop - 15;

          //show map popup
          map.getCanvas().style.cursor = 'pointer';
          let popupText = `<div class="label ${statusClass}">${marker["#country+name"]}<div class="type">${marker["#data+month+year"]}</div></div>`;
          popup.setLngLat(coords).setHTML(popupText).addTo(map);
        });

        el.addEventListener('mouseout', () => {
          map.getCanvas().style.cursor = '';
          popup.remove();
        });

        //add markers to the map
        new mapboxgl.Marker(el)
          .setLngLat(coords)
          .addTo(map);
      }

      if (isMobile) {
        // $('#legend').addClass('collapsed');

        $('#legend').on('click', function() {
          $(this).toggleClass('collapsed');
        });
      }
    });
  }


  function initPanel(country) {
    let content = '';
    let actors = country['#actors+text'].replaceAll(', ', '<br>');
    let links = country['#project+document'].replaceAll(' | ', '<br>');

    content += `<h2 id="${country['#country+name']}">${country['#country+name']}</h2>`;
    content += '<table>';

    content += `<tr><td>Status: </td><td>${country['#status+name']}</td></tr>`;
    if(country['#data+month+year']) {
      content += `<tr><td>Date endorsed: </td><td>${country['#data+month+year']}</td></tr>`;
    }
    if(actors) {
      content += `<tr><td>Actors involved: </td><td>${actors}</td></tr>`;
    }
    if(country['#meta+url']) {
      content += `<tr><td>Public comms: </td><td>${country['#meta+url']}</td></tr>`;
    }
    if(links) {
      content += `<tr><td>Link(s) to ISP: </td><td>${links}</td></tr>`;
    }

    content += '</table>'

    $('#panel').removeClass('hidden').find('.panel-inner').html(content);
  }

  function initTracking() {
    //initialize mixpanel
    let MIXPANEL_TOKEN = '';
    mixpanel.init(MIXPANEL_TOKEN);
    mixpanel.track('page view', {
      'page title': document.title,
      'page type': 'datavis'
    });
  }

  getData();
  //initTracking();
});
