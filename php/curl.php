<?php
    class InfoAuto {

        public $token;
        public $dataInput;

        public function login() {
    
            // Credenciales de autenticación básica
            $username = 'alejandro.amado@lever.com.ar';
            $password = 'tFz2SRHrrSkNAzBZ';
    
            // Iniciar una sesión cURL
            $ch = curl_init();
    
            $url = "https://api.infoauto.com.ar/cars/auth/login";
            $headers = array(
                "Content-Length: 0",
                "Content-type: application/json",
                "Authorization: Basic " . base64_encode($username . ":" . $password)
            );

            $ch = curl_init();
            curl_setopt($ch, CURLOPT_URL, $url);
            curl_setopt($ch, CURLOPT_POST, 1);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
            curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);

            $response = curl_exec($ch);

            if (curl_errno($ch)) {
                echo 'Error:' . curl_error($ch);
            } else {
                $tokens = json_decode($response, true);
                $access_token = $tokens['access_token'];
                $refresh_token = $tokens['refresh_token'];
                $this->token = $access_token;
                //echo $this->token;
            }
    
            curl_close($ch);
        }      

        public function getCodia() {
            //$marca = 'INTEGRA';
            //$modelo = 'INTEGRA SE';
            
            $marca = "AGRALE";
            $modelo = "14000 S 4x2";

            $url = "https://api.infoauto.com.ar/cars/pub/search/?query_string={$marca}";
            
            function buscarArrayPorValor($array, $valorBuscado) {
                foreach ($array as $clave => $valor) {
                    if ($valor === $valorBuscado) {
                        return $array;
                    }
                    if (is_array($valor)) {
                        $resultado = buscarArrayPorValor($valor, $valorBuscado);
                        if ($resultado !== null) {
                            return $resultado;
                        }
                    }
                }
                return null;
            }

            // Access token obtenido en el paso anterior
            $access_token = $this->token;

            // Iniciar una sesión cURL
            $ch = curl_init();

            curl_setopt($ch, CURLOPT_URL, $url);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
            curl_setopt($ch, CURLOPT_HTTPHEADER, array(
                'Authorization: Bearer ' . $access_token
            ));

            $response = curl_exec($ch);

            if (curl_errno($ch)) {
                echo 'Error:' . curl_error($ch);
            } else {
                $user_info = json_decode($response, true);
                $subArrayEncontrado = buscarArrayPorValor($user_info, $modelo);
                if ($subArrayEncontrado["list_price"] === true) {
                    return $subArrayEncontrado["codia"];
                } else {
                    return print_r('El auto buscado no posee codia activo');
                }
            }

            

            curl_close($ch);
        }

        public function getCars() {
            $url = 'https://api.infoauto.com.ar/cars/pub/search/?price_at=2023';

            // Access token obtenido en el paso anterior
            $access_token = $this->token;

            // Iniciar una sesión cURL
            $ch = curl_init();

            curl_setopt($ch, CURLOPT_URL, $url);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
            curl_setopt($ch, CURLOPT_HTTPHEADER, array(
                'Authorization: Bearer ' . $access_token
            ));

            $response = curl_exec($ch);

            if (curl_errno($ch)) {
                echo 'Error:' . curl_error($ch);
            } else {
                $cars = json_decode($response, true);
                print_r($cars);
            }
        }

        public function getYearSelected() {
            $yearSelected = json_decode(file_get_contents('php://input', true));
            return $yearSelected;
        }

        public function getBrandsByYear($year, $access_token) {
            
            if($year == date('Y')) {
                $url = "https://api.infoauto.com.ar/cars/pub/brands/?query_mode=matching&list_price=true&page=1&page_size=100";
            } else {
                $url = "https://api.infoauto.com.ar/cars/pub/brands/?query_mode=matching&price_at=$year&page=1&page_size=100";
            }

            // Access token obtenido en el paso anterior
            //$access_token = $this->token;

            // Iniciar una sesión cURL
            $ch = curl_init();

            curl_setopt($ch, CURLOPT_URL, $url);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
            curl_setopt($ch, CURLOPT_HTTPHEADER, array(
                'Authorization: Bearer ' . $access_token
            ));

            $response = curl_exec($ch);

            if (curl_errno($ch)) {
                echo 'Error:' . curl_error($ch);
            } else {
                $brandsByYear = json_decode($response, true);
                $brandsList = [];
                for ($i = 0; $i < count($brandsByYear); $i++) {
                    $brandsList[] = [
                        'id' => $brandsByYear[$i]['id'],
                        'name' => $brandsByYear[$i]['name'],
                        'logo' => $brandsByYear[$i]['logo_url']
                    ];
                }
                echo json_encode(['accessToken' => $access_token, 'brands' => $brandsList], TRUE);
            }
        }

    public function getModelsByBrand($id, $anio, $access_token)
    {
        $carsDescriptionList = [];
        $page = 1;
        $page_size = 100; // Tamaño máximo por página
        $models = [];

        while (true) {
            if ($anio == date('Y')) {
                $url = "https://api.infoauto.com.ar/cars/pub/brands/$id/models/?query_mode=matching&list_price=true&page=$page&page_size=$page_size";
            } else {
                $url = "https://api.infoauto.com.ar/cars/pub/brands/$id/models/?query_mode=matching&price_at=$anio&page=$page&page_size=$page_size";
            }

            // Iniciar una sesión cURL
            $ch = curl_init();
            curl_setopt($ch, CURLOPT_URL, $url);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
            curl_setopt($ch, CURLOPT_HTTPHEADER, array(
                'Authorization: Bearer ' . $access_token
            ));

            $response = curl_exec($ch);

            if (curl_errno($ch)) {
                echo 'Error:' . curl_error($ch);
                return;
            }

            $models = json_decode($response, true);

            // Si la API no devuelve modelos o devuelve menos de 100, terminamos el bucle
            if (empty($models)) {
                break;
            }

            foreach ($models as $model) {
                $carsDescriptionList[] = [
                    'modelo' => $model['description'],
                    'codia' => $model['codia']
                ];
            }

            if (count($models) < $page_size) {
                break; // Última página, salimos del bucle
            }

            $page++; // Pasamos a la siguiente página
        }

        echo json_encode(['accessToken' => $access_token, 'models' => $carsDescriptionList], TRUE);
    }

    public function getPriceByCodia($codia, $year, $access_token)
    {
        if ($year == date('Y')) {
            $url = "https://api.infoauto.com.ar/cars/pub/models/{$codia}/list_price";
        } else {
            $url = "https://api.infoauto.com.ar/cars/pub/models/{$codia}/prices/";
        }

        // Iniciar una sesión cURL
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
        curl_setopt($ch, CURLOPT_HTTPHEADER, array(
            'Authorization: Bearer ' . $access_token
        ));

        $response = curl_exec($ch);

        if (curl_errno($ch)) {
            echo 'Error:' . curl_error($ch);
        } else {
            $price_info = json_decode($response, true);
            $price = null;

            if ($year == date('Y')) {
                $price = $price_info['list_price'];
            } else {
                foreach ($price_info as $item) {
                    if ($item['year'] == $year) {
                        $price = $item['price'];
                        break;
                    }
                }
            }
            echo json_encode(['accessToken' => $access_token, 'price' => ($price * 1000)], TRUE);
        }
    }
}

    //Acceso Cors
    header("Access-Control-Allow-Origin: *");
    header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
    header("Access-Control-Allow-Headers: Origin, Content-Type, Accept, Authorization");

    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $datos = file_get_contents('php://input');
        $data = json_decode($datos, TRUE);
        $access_token = $data['accessToken'] ?? null;

        $a = new InfoAuto();

        if ($access_token == null) {
            $a->login();
            $access_token = $a->token;
        }

        //$a->login();
        
        if (json_last_error() === JSON_ERROR_NONE) {
            // Acceder a los datos
            $year = $data['year'] ?? '';
            $action = $data['action'] ?? '';
            $id = $data['idMarca'] ?? '';
            $codia = $data['codia'] ?? '';
            
            switch ($action) {
                case "getBrandsByYear" : 
                    $a->getBrandsByYear($year, $access_token);
                    break;
                case "getModelsByBrand" : 
                    $a->getModelsByBrand($id, $year, $access_token);
                    break;
                case "getPriceByCodia" : 
                    $a->getPriceByCodia($codia, $year, $access_token);
                    break;
            }

        } else {
            // Manejar error de decodificación JSON
            echo "Error al decodificar los datos JSON.";
        }

        //echo json_decode($_POST[""], TRUE);
        die();
    }
    //codia activos: 630036, 630037, 630030, 630034
?>