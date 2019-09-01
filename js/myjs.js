/* 
  Created by KP -  22/03/2019
*/

function ButtonClicked(url,id) {
    window.open(url)
    $(id).modal('hide');
}

function hidethis(button) {
  document.getElementById('wrapper').style.display = 'none';
}

function hidethis1(button) {
  document.getElementById('wrapper').style.display = 'flex';
}

function hidethis2(button) {
  document.getElementById('wrapper1').style.display = 'none';
}

function hidethisfinal() {
  $('#demo1').collapse('toggle');
  document.getElementById('wrapper').style.display = 'flex';
  document.getElementById('wrapper1').style.display = 'flex';  
}