/*

state.id = unique id to identify instance of vs

state.viewtype = one of the following:
 grid, bar-chart, line-chart, scatter-chart, treemap, d3map, googlemap

state.groupbys = [dimensions]

state.measures = [measures]

state.dimfilters = [dimension members]

state.valfilters = [value member inequalities]

state.tile_config = {header: , subheader: , body: , parentdiv: }

   <div class="col-lg-6">
      <div class="card z-index-2">
        <div class="card-header pb-0">
          <h6>header</h6>
          <p class="text-sm">
            <i class="fa fa-arrow-up text-success"></i>
            <span class="font-weight-bold">subheader</span> in 2021
          </p>
        </div>
        <div class="card-body p-3">
          <div class="chart">
            <canvas id="chart-line" class="chart-canvas" height="300"></canvas>
          </div>
        </div>
      </div>
    </div>

<div class="dropdown pe-4">
              <button class="btn btn-secondary btn-sm dropdown-toggle" type="button" id="dropdownMenu2" data-bs-toggle="dropdown" aria-expanded="false">
                Dropdown
              </button>
              <ul class="dropdown-menu" aria-labelledby="dropdownMenu2">
                <li><button class="dropdown-item" type="button">Action</button></li>
                <li><button class="dropdown-item" type="button">Another action</button></li>
                <li><button class="dropdown-item" type="button">Something else here</button></li>
              </ul>
            </div>

 */
/*******************************************************************************/
//Global Vars

const ps_object = {}
/*******************************************************************************/

function Comma_Sep(a,vs_id) {
  var s = "";
  for (let i = 0; i < a.length; i++) {
    let item=a[i]
    if(item.startsWith('?')){
      let dd_id=item.slice(1)
      s+=$(`#${dd_id}-${vs_id}`).val()
    }
    else
      s += item;

    if (i < a.length - 1) 
      s += ",";
  }

  return s;
}

function itemSubstitute(a_in, vs_id) {
  var a_out = [];
  for (let i = 0; i < a_in.length; i++) {
    let item=a_in[i]
    if(item.startsWith('?')){
      let dd_id=item.slice(1)
      a_out.push($(`#${dd_id}-${vs_id}`).val())
    }
    else
      a_out.push(item);
  }

  return a_out;
}

function chartColorGradient(canvas, bg_color){
  let ctx2 = canvas.getContext("2d");
  let gradientStroke = ctx2.createLinearGradient(0, canvas.scrollHeight, 0, 50);
  gradientStroke.addColorStop(1, hexToRGB(bg_color, 0.2));
  gradientStroke.addColorStop(0.2, 'rgba(72,72,176,0.0)');
  gradientStroke.addColorStop(0, hexToRGB(bg_color, 0));
  return gradientStroke
}

async function serverRequest(params) {
  let p = new URLSearchParams(params).toString();

  // const api_url = `gserver/${p}`;

  // var request = new Request(api_url, { method: "POST" });

  var request = new Request(`http://127.0.0.1:55555/req?${p}`, { method: "GET" });

  const response = await fetch(request);
  const json = await response.json();

  return json;
}

function getDataColumn (server_js, col_idx){
  var data_col=[]
  for (let row of server_js){
    data_col.push(row[1][col_idx])
  }
  return data_col
}

function hexToRGB(hex, alpha) {
  var r = parseInt(hex.slice(1, 3), 16),
      g = parseInt(hex.slice(3, 5), 16),
      b = parseInt(hex.slice(5, 7), 16);

  if (alpha!==undefined) {
      let rgba=`rgba(${r},${g},${b},${alpha})`
      return `rgba(${r},${g},${b},${alpha})`;
  } else {
      return `rgba(${r},${g},${b})`;
  }
}

/*******************************************************************************/
class View_State 
{
  constructor(state)
  {
    this.state=state
    this.obj_instance=null
    this.server_js=null
    this.maximized=false
  }
  createRequestParams()
  { 
    let req=this.state.request
    let vs_id=this.getId()
    let params =  {
      qid: req.qid,
      dim: req.base_dim,
      gby: Comma_Sep(req.groupbys, vs_id),
      val: Comma_Sep(req.measures, vs_id),
      // dim_filters: encodeURIComponent(getDimFilterStr(global_dim_filters)),
      // val_filters: getValFilterStr(global_val_filters)
    };
    return params
  }
  async serverRequest()
  {
    let params=this.createRequestParams();
    let server_result = await serverRequest(params);

    let server_meta=server_result["meta"];

    if (server_meta.status != "OK"){
      alert("The data server returned "+ server_meta.status)
      return
    }
    this.server_js=server_result["data"]
    // if (server_meta.is_range)
    //   server_range = server_result.range;
  }
  getId()
  {
    return this.state.id
  }
  getHeight()
  {
    return this.state.tile_config.height
  }
  getWidth()
  {
    return this.state.tile_config.width
  }
  hide()
  {
    $(`#${this.getId()}-box`).hide()
  }
  show()
  {
    $(`#${this.getId()}-box`).show()
  }
  maximize()
  {
    $('.content').height('65vh')
    $(`#${this.getId()}-box`).attr('class', 'col-lg-12')
    this.maximized=true
    this.refresh()
  }
  restore()
  {
    let id=this.getId()
    this.maximized=false
    $(`#${id}-box`).attr('class', `col-lg-${this.getWidth()} mt-4`)
    $('.content').height(this.getHeight())
    if (this.state.view_type=='chart')
    {
      $(`#${this.getId()}`).height(this.getHeight())
    }
    this.refresh()
    this.show()
  }
  refresh()
  {
    let type=this.state.view_type
    let vs_id=this.getId()
    switch(type)
    {
      case 'grid':
        w2ui[vs_id].refresh()
        ps_object[vs_id].destroy()
        const ps = new PerfectScrollbar(`#grid_${vs_id}_records`, {
          wheelSpeed: 2,
          wheelPropagation: false,
          minScrollbarLength: 20
        })
        ps_object[vs_id]=ps
        break
      case 'chart':
        let canvas = document.getElementById(vs_id);
        let this_chart = this.object_instance;
        this_chart.data.datasets.forEach((dataset, i) => {
          let chart_def = this.state.chart_def[i];
          let bg_color = chart_def.backgroundColor;
          dataset.backgroundColor=chartColorGradient(canvas, bg_color)
        });
        this_chart.update()
        break
    }
  }
  createDropdownList(contents){
    let list=''
    for (let i=0; i<contents.length; ++i){
      let item=contents[i]
      list+=`<option ${i==0?'selected':''} value="${item}">${item}</option>`
    }
    return list
  }
  createDropdowns(){
    if ('dropdowns' in this.state == false)
      return ''
    let dropdowns=this.state.dropdowns
    let dropdown_html=''
    for (const [id, def] of Object.entries(dropdowns))
    {
      dropdown_html+=`<div class="col ps-0 text-center"><h6 class="mb-1">${id=="gby_option"?"Groupbys":id=="val_option"?"Measures":null}</h6><select id=${id}-${this.getId()} class="form-select form-select-sm pt-0" data-tile-id="${this.getId()}" aria-label=".form-select-sm example">
      ${this.createDropdownList(def.contents)}
      </select></div>`
    }
    return dropdown_html
  }
  createTile()
  {
    let cfg=this.state.tile_config
    
    $(cfg.parent_div).append(`<div id="${this.getId()}-box" class="col-lg-${cfg.width} mt-4">
      <div class="card z-index-2">
        <div class="card-header pb-0">
          <div class="row">
            <div class="col-4">
              <h6>${cfg.header}</h6>
              <p class="text-sm mb-0">
                ${cfg.subheader}
              </p>
            </div>
            <div class="col-8 my-auto">
              <div class="row">
                <div class="col-8 my-auto text-start">
                  <div class="row">
                   ${this.createDropdowns()}
                  </div>
                </div>
                <div class="col-4 my-auto">
                  <div class="dropdown float-end pe-4">
                    <a class="cursor-pointer" id="dropdownTable" data-bs-toggle="dropdown" aria-expanded="false">
                      <i class="fa fa-ellipsis-v text-secondary" aria-hidden="true"></i>
                    </a>
                    <ul id="tile-functions" class="dropdown-menu px-2 py-3 me-sm-n5 me-n5" aria-labelledby="dropdownTable" style="">
                      <li><a class="dropdown-item border-radius-md" onclick="maximizeTile(\'${this.getId()}\')">Maximize</a></li>
                      <li><a class="dropdown-item border-radius-md" onclick="restoreTiles()">Restore Tiles</a></li>
                      <li><a class="dropdown-item border-radius-md" href="javascript:;">Something else here</a></li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
        </div>
        </div>
         <div class="card-body p-3">
            <${this.state.view_type=='chart'?'canvas':'div'} id="${this.getId()}" class="content" style="width: 100%; height:${cfg.height};">
          </div>
        </div>
      </div>
     </div>`);

     this.createContent()
  }
  createContent() {
    try{
      this[this.state.view_type]()
    }
    catch (e){

    }
  }

   text()
   {
    $(`#${this.getId()}`).append(`<h5 class="font-weight-bolder">Gigaroll Dashboard</h5><p class="text-lg">${this.state.text}</p>`)
   }
   googlemap()
  {
    try{
    let map = new google.maps.Map(document.getElementById(this.getId()), {
      fullscreenControl: false,
      zoom: 8,
      center: { lat: 50, lng: 50 },
      gestureHandling: "cooperative",
    });
    }
    catch(e)
    {console.log(e)}

  }
  async grid(){

    await this.serverRequest()

    let req=this.state.request
    let vs_id=this.getId()

    let gby_headers=itemSubstitute(req.groupbys, vs_id)
    let val_headers=itemSubstitute(req.measures, vs_id)

    let server_js=this.server_js

    let columns=[]

    for (let col of gby_headers){
      // let col_name=col.startsWith('?')?$(`#${col.slice(1)}`).val():col
      columns.push({field:col, text:col, attr:col, sortable:true})
      // searches.push({field:col, text:col, label:col, type:"text"})
    }
    for (let col of val_headers){
      columns.push({field:col, text:col, sortable:true})
      // searches.push({field:col, text:col, label:col, type:"float"})
    }

    let count=1
    let records=[]

    for (let row of server_js){
      let rec={recid:count++}
      let n_gbys=gby_headers.length
      for (let i=0; i<n_gbys; i++){
        rec [gby_headers[i]]=row[0][i]
      }
      for (let i=0; i<val_headers.length; i++){
        rec[val_headers[i]]=row[1][i]
      }
      records.push(rec)
    }

    try{
      try{w2ui[this.getId()].destroy()}
      catch(e){}
       this.object_instance=$(`#${this.getId()}`).w2grid({
        name: this.getId(),
        columns: columns,
        records: records,
        // searches: searches,
        });
        if(this.getId() in ps_object)
        {
          ps_object[this.getId()].destroy()
        }
        const ps = new PerfectScrollbar(`#grid_${this.getId()}_records`, {
          wheelSpeed: 2,
          wheelPropagation: false,
          minScrollbarLength: 20
        })
        ps_object[this.getId()]=ps
    }
    catch(e)
    {console.log(e)}
  }
  chart()
  {
    try{
      this[this.state.view_subtype]()
    }
    catch (e){

    }
  }
  async lineChart()
  {
    await this.serverRequest()

    if (this.object_instance)
    {
      this.object_instance.destroy()
    }
    
    if(this.maximized)
      $('.content').height('65vh')

    let req=this.state.request
    let vs_id=this.getId()

    let val_headers=itemSubstitute(req.measures, vs_id)

    let server_js=this.server_js

    let canvas = document.getElementById(vs_id);

    let ctx2 = canvas.getContext("2d");

    let labels=[]

    for (let row of this.server_js){
      labels.push(row[0][0])
      //to do: handle multiple group bys
    }

    let ds = []

    for (let i=0, n=val_headers.length; i<n; ++i) 
    { 
      let chart_def = this.state.chart_def[i];
      let bg_color = chart_def.backgroundColor;
      let data = getDataColumn(server_js, i);
      let d = {
        label: val_headers[i],
        data: data,
        yAxisID: chart_def.yAxisID,
        type: chart_def.type,
        tension: 0.4,
        borderWidth: 0,
        pointRadius: 0,
        borderColor: chart_def.borderColor,
        borderWidth: 3,
        backgroundColor: chartColorGradient(canvas, bg_color),
        fill: true
      }
      ds.push(d)
    }

    this.object_instance = new Chart(ctx2, {
      type: "line",
      data: {
        labels: labels,
        datasets: ds,
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
          }
        },
        interaction: {
          intersect: false,
          mode: 'index',
        },
        scales: {
          y: {
            grid: {
              drawBorder: false,
              display: true,
              drawOnChartArea: true,
              drawTicks: false,
              borderDash: [5, 5]
            },
            ticks: {
              display: true,
              padding: 10,
              color: '#b2b9bf',
              font: {
                size: 11,
                family: "Open Sans",
                style: 'normal',
                lineHeight: 2
              },
            }
          },
          x: {
            grid: {
              drawBorder: false,
              display: false,
              drawOnChartArea: false,
              drawTicks: false,
              borderDash: [5, 5]
            },
            ticks: {
              display: true,
              color: '#b2b9bf',
              padding: 20,
              font: {
                size: 11,
                family: "Open Sans",
                style: 'normal',
                lineHeight: 2
              },
            }
          },
        },
      },
    });
  }
  barChart(){
    $(`#${this.getId()}`).replaceWith(`<div class="chart bg-gradient-dark border-radius-lg"><canvas id="${this.getId()}" class="chart-canvas" height="300"></canvas></div>`);

    var ctx = document.getElementById(this.getId()).getContext("2d");

    this.object_instance = new Chart(ctx, {
      type: "bar",
      data: {
        labels: ["Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
        datasets: [{
          label: "Sales",
          tension: 0.4,
          borderWidth: 0,
          borderRadius: 4,
          borderSkipped: false,
          backgroundColor: "#fff",
          data: [450, 200, 100, 220, 500, 100, 400, 230, 500],
          maxBarThickness: 6
        }, ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
          }
        },
        interaction: {
          intersect: false,
          mode: 'index',
        },
        scales: {
          y: {
            grid: {
              drawBorder: false,
              display: false,
              drawOnChartArea: false,
              drawTicks: false,
            },
            ticks: {
              suggestedMin: 0,
              suggestedMax: 500,
              beginAtZero: true,
              padding: 15,
              font: {
                size: 14,
                family: "Open Sans",
                style: 'normal',
                lineHeight: 2
              },
              color: "#fff"
            },
          },
          x: {
            grid: {
              drawBorder: false,
              display: false,
              drawOnChartArea: false,
              drawTicks: false
            },
            ticks: {
              display: false
            },
          },
        },
      },
    });
  }
}//end of Class definition

function initMap (){
 
}
