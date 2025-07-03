<?php
    
    function response($status, $data){
        http_response_code($status);
        header("Content-Type: application/json; charset=UTF-8");
        echo json_encode($data);
        exit();
    }

    
?>