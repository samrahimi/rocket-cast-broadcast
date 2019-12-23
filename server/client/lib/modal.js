/**
 * Author: Sam Rahimi, Dec 2019
 * Forked from Fatima Aurelia's demo: https://www.cssscript.com/simplest-modal-component-pure-javascript/
 */
$(document).ready(() => {
    $(".modal-toggle").on("click", (e) => {
        e.preventDefault()
        if ($(".modal").hasClass("open")) {
            $(".modal").removeClass("open")
        } else {
            $(".modal").addClass("open")
            // for a multiple modal setup, perhaps $("#"+$(this).attr("data-target")).addClass("open")
        }
    
        return false;
    })
})
