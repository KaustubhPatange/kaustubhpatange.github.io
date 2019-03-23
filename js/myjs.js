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

$('.viewmore1').hover(
  function() {
      var $this = $(this); // caching $(this)
      $this.data('defaultText', $this.text());
      $this.text("SURE!");
  },
  function() {
      var $this = $(this); // caching $(this)
      $this.text($this.data('defaultText'));
  }
);