var view_states=[]

let req1 =
  {
    qid: "MD_AGG",
    base_dim: 'property',
    groupbys: ["prop_type"],
    measures: ["beds:count", "price:avg"],
    filters: []
  }

let req2 =
{
  qid: "MD_AGG",
  base_dim: 'property',
  groupbys: ["state_code"],
  measures: ["beds:count", "size:avg"],
  filters: []
}

let req3 =
{
  qid: "MD_AGG",
  base_dim: 'property',
  groupbys: ['?gby_option'],
  measures: ["beds:count", "?val_option"],
  filters: []
}

let req4 =
{
  qid: "MD_AGG",
  base_dim: 'property',
  groupbys: ['?gby_option'],
  measures: ['?val_option'],
  filters: []
}

let chart_def = [
  {
    yAxisID: "left",
    type: "line",
    backgroundColor: "#ff0000",
    borderColor:"#ff0000"
  },
  {
    yAxisID: "right",
    type: "line",
    backgroundColor: "#0000ff",
    borderColor:"#0000ff"
  } 
]

let dropdowns = {
  gby_option:{
    name:'Groupby',
    contents:['state_code', 'postal_code', 'city']
  },
  val_option:{
    name:'Value',
    contents:['size:avg', 'price:avg']
  }
}

let page_def=[
[{id:'text', view_type:'text', text:"Here is an assortment of displays of your data. These will be updated in real-time as we receive new information. Feel free to peruse them to your heart's content!", tile_config: {header: `Welcome Ramin!`, subheader: `Daily Reports`, height:'300px', width:6}}],
[{id:'map', view_type:'googlemap', tile_config: {header: `Map`, subheader: `Map of properties`, height:'300px', width:6}},
{id:'grid1', view_type:'grid', request: req3, dropdowns:dropdowns, tile_config: {header: `Grid`, subheader: `This is a Grid`, height:'300px', width:6, }}],
// [{tile_config: {header: `this is row 0`, subheader: `this is column 0`}},
// {tile_config: {header: `this is row 0`, subheader: `this is column 0`}}],
[{id:'line-chart1', view_type:'chart',  view_subtype:'lineChart', request: req3, dropdowns:dropdowns, chart_def: chart_def, tile_config: {header: `Line Chart`, subheader: `this is a Line Chart`, height:'300px', width:6}},
{id:'line-chart2', view_type:'chart', view_subtype:'lineChart', request: req2, chart_def: chart_def, tile_config: {header: `Bar Chart`, subheader: `this is a Bar Chart`, height:'300px', width:6}},
{id:'grid2', view_type:'grid', request: req1,  tile_config: {header: `Grid2`, subheader: `This is a Grid2`, height:'300px', width:6}},
{id:'treemap1', view_type:'treemap', request: req4, dropdowns:dropdowns,  tile_config: {header: `Treemap`, subheader: `This is a Treemap`, height:'300px', width:6}}]
]

let row_id=0

for (let row of page_def)
{
  // $('#feature-board').append(`<div id= row_${row_id} class="row mt-4"></div>`)
  for (let elt of row)
  {
    // elt.tile_config.parent_div=(`#row_${row_id}`)
    elt.tile_config.parent_div=('#feature-board')
    let vs= new View_State (elt)
    vs.createTile()
    view_states.push(vs)
  }
  ++row_id
}

function maximizeTile(tileID){
  for (vs of view_states){
    let id=vs.getId()
    if (id==tileID)
    {
      vs.maximize()
    }
    else 
    {
      vs.hide()
    }
  }
}

function restoreTiles()
{
  for (vs of view_states)
  {
   vs.restore()
  }
  refreshTiles()
}

function refreshTiles(){
  for (vs of view_states)
  {
   vs.refresh()
  }
 
}

$(".form-select").on("change", function () {
  let id=$(this).attr('data-tile-id')
  for (vs of view_states){
    if (vs.getId()==id){
      vs.createContent()
    }
  }
})


$(document).ready();
$(window).resize(refreshTiles);

