<?php
error_reporting(E_ERROR | E_PARSE); // Solo errores graves, no warnings/notices
class InfoAuto
{
    public $token;
    public $dataInput;
    public $apiType = 'cars'; // 'cars' o 'motorcycles'
    public $username;
    public $password;

    public function setApiType($categoria)
    {
        $cat = strtolower(trim($categoria));
        // Si contiene "moto" en cualquier parte, es moto
        if (strpos($cat, 'moto') !== false) {
            $this->apiType = 'motorcycles';
            $this->username = 'alejandro.amado@lever.com.ar';
            $this->password = 'a2tyKwLEGUaucurp';
        } else {
            $this->apiType = 'cars';
            $this->username = 'alejandro.amado@lever.com.ar';
            $this->password = 'tFz2SRHrrSkNAzBZ';
        }
    }

    public function login()
    {
        $username = $this->username;
        $password = $this->password;
        $apiType = $this->apiType;

        $url = "https://api.infoauto.com.ar/{$apiType}/auth/login";
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
            $this->token = $access_token;
        }

        curl_close($ch);
    }

    public function getCodia()
    {
        //$marca = 'INTEGRA';
        //$modelo = 'INTEGRA SE';

        $marca = "AGRALE";
        $modelo = "14000 S 4x2";

        $url = "https://api.infoauto.com.ar/cars/pub/search/?query_string={$marca}";

        function buscarArrayPorValor($array, $valorBuscado)
        {
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

    public function getCars()
    {
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

    public function getYearSelected()
    {
        $yearSelected = json_decode(file_get_contents('php://input', true));
        return $yearSelected;
    }

    // --- MODIFICADO: getBrandsByYear acepta $features ---
    public function getBrandsByYear($year, $access_token, $features = [])
    {
        $apiType = $this->apiType;

        // Detectar si es motos y año actual
        $isMotos = ($apiType === "motorcycles");
        $isActualYear = ($year == date('Y'));

        $baseUrl = "https://api.infoauto.com.ar/{$apiType}/pub/brands/?query_mode=matching";

        if ($isMotos && $isActualYear) {
            $baseUrl .= "&list_price=true";
        } elseif ($isMotos) {
            $baseUrl .= "&prices_from=$year&prices_to=$year";
        } else {
            $baseUrl .= "&prices_from=$year&prices_to=$year";
            // Solo para autos/camiones agregamos features
            if (!empty($features)) {
                foreach ($features as $f) {
                    if ($f) {
                        $baseUrl .= "&feature_3=" . urlencode($f);
                    }
                }
            }
        }
        $baseUrl .= "&page=1&page_size=100";
        // LOG: Ver la URL final y los features
        file_put_contents(__DIR__ . '/log_infoauto_url.txt', date('c') . " URL: $baseUrl\nFeatures: " . json_encode($features) . "\n", FILE_APPEND);

        // Iniciar una sesión cURL
        $ch = curl_init();

        curl_setopt($ch, CURLOPT_URL, $baseUrl);
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
                // Para motos, el campo puede ser 'logo_url' o puede venir vacío/null
                $logo = isset($brandsByYear[$i]['logo_url']) && $brandsByYear[$i]['logo_url']
                    ? $brandsByYear[$i]['logo_url']
                    : null;
                $brandsList[] = [
                    'id' => $brandsByYear[$i]['id'],
                    'name' => $brandsByYear[$i]['name'],
                    'logo' => $logo
                ];
            }
            echo json_encode(['accessToken' => $access_token, 'brands' => $brandsList], TRUE);
        }
    }

    // --- MODIFICADO: getModelsByBrand acepta $features ---
    public function getModelsByBrand($id, $anio, $access_token, $features = [])
    {
        $apiType = $this->apiType;
        $carsDescriptionList = [];
        $page = 1;
        $page_size = 100; // Tamaño máximo por página
        $models = [];

        while (true) {
            if ($anio == date('Y')) {
                $url = "https://api.infoauto.com.ar/{$apiType}/pub/brands/$id/models/?query_mode=matching&list_price=true";
            } else {
                $url = "https://api.infoauto.com.ar/{$apiType}/pub/brands/$id/models/?query_mode=matching&price_at=$anio";
            }
            // Agregar features
            if (!empty($features)) {
                foreach ($features as $f) {
                    $url .= "&feature_3=" . urlencode($f);
                }
            }
            $url .= "&page=$page&page_size=$page_size";

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
        $apiType = $this->apiType;
        $logFile = __DIR__ . '/log_infoauto_backend.txt';
        $logPrefix = "[" . date('Y-m-d H:i:s') . "] codia: $codia | year: $year | apiType: $apiType\n";

        if ($year == date('Y')) {
            $url = "https://api.infoauto.com.ar/{$apiType}/pub/models/{$codia}/list_price";
        } else {
            $url = "https://api.infoauto.com.ar/{$apiType}/pub/models/{$codia}/prices/";
        }

        // Iniciar una sesión cURL
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
        curl_setopt($ch, CURLOPT_HTTPHEADER, array(
            'Authorization: Bearer ' . $access_token
        ));

        $response = curl_exec($ch);

        // --- LOG: Guardar request y response ---
        file_put_contents($logFile, $logPrefix . "URL: $url\nRESPONSE: $response\n", FILE_APPEND);

        if (curl_errno($ch)) {
            $error = 'Error:' . curl_error($ch);
            file_put_contents($logFile, $logPrefix . "CURL ERROR: $error\n", FILE_APPEND);
            echo $error;
        } else {
            $price_info = json_decode($response, true);
            file_put_contents($logFile, $logPrefix . "PARSED: " . print_r($price_info, true) . "\n", FILE_APPEND);
            $price = null;

            if ($year == date('Y')) {
                // Verificar si existe la clave 'list_price'
                $price = (isset($price_info['list_price']) && is_numeric($price_info['list_price']))
                    ? $price_info['list_price']
                    : 0;
            } else {
                if (is_array($price_info)) {
                    foreach ($price_info as $item) {
                        if (is_array($item) && isset($item['year']) && $item['year'] == $year) {
                            $price = $item['price'];
                            break;
                        }
                    }
                }
            }
            file_put_contents($logFile, $logPrefix . "PRICE FOUND: " . ($price ? $price * 1000 : 0) . "\n", FILE_APPEND);
            echo json_encode(['accessToken' => $access_token, 'price' => ($price ? $price * 1000 : 0)], TRUE);
        }
        curl_close($ch);
    }

    public function getFeaturesByCodia($codia, $access_token)
    {
        $apiType = $this->apiType;
        $url = "https://api.infoauto.com.ar/{$apiType}/pub/models/{$codia}/features/";

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
            $features = json_decode($response, true);
            // Filtrar solo la feature "Tipo de vehículo"
            $tipoVehiculo = null;
            if (is_array($features)) {
                foreach ($features as $f) {
                    if (
                        isset($f['description']) &&
                        strtolower($f['description']) === 'tipo de vehículo'
                    ) {
                        $tipoVehiculo = $f;
                        break;
                    }
                }
            }
            // Devolver solo la feature encontrada (o null si no existe)
            echo json_encode($tipoVehiculo);
        }
        curl_close($ch);
    }

    public function getMotorcyclePriceByVehicleId($codia, $access_token)
    {
        $url = "https://api.infoauto.com.ar/motorcycles/pub/vehicles/{$codia}/prices/";

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
            echo json_encode(['accessToken' => $access_token, 'prices' => $price_info], TRUE);
        }
    }
}

// --- INICIO: Clase para InfoExperto ---
class InfoExperto
{
    private $apiKey = '886aab32-9050-4453-ba91-30540cf6084a';
    private $baseUrl = 'https://servicio.infoexperto.com.ar/api/informeApi/';

    public function obtenerInformeCuit($cuit, $tipo = 'normal')
    {
        $url = $this->baseUrl . 'obtenerInforme';
        $fields = [
            'apiKey' => $this->apiKey,
            'cuit' => $cuit,
            'tipo' => $tipo
        ];
        return $this->doCurl($url, $fields);
    }

    public function obtenerInformeDni($dni, $tipo = 'normal')
    {
        $url = $this->baseUrl . 'obtenerInformeDni';
        $fields = [
            'apiKey' => $this->apiKey,
            'dni' => $dni,
            'tipo' => $tipo
        ];
        return $this->doCurl($url, $fields);
    }

    private function doCurl($url, $fields)
    {
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_POST, 1);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $fields);
        curl_setopt($ch, CURLOPT_TIMEOUT, 8); // Reducido de 20 a 8 segundos

        // IMPORTANTE: Para depuración, mostrar la respuesta completa de InfoExperto
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

        if (curl_errno($ch)) {
            $error = curl_error($ch);
            curl_close($ch);
            return json_encode(['status' => 'error', 'message' => $error]);
        }
        curl_close($ch);

        // Si la respuesta es "acceso denegado" o similar, devolver el mensaje tal cual
        $json = json_decode($response, true);
        if (isset($json['status']) && strtolower($json['status']) === 'error') {
            return json_encode([
                'status' => 'error',
                'message' => $json['message'] ?? 'Acceso denegado o error de InfoExperto',
                'raw' => $json
            ]);
        }

        // Si el HTTP code es 403 o 401, devolver acceso denegado
        if ($httpCode === 401 || $httpCode === 403) {
            return json_encode([
                'status' => 'error',
                'message' => 'Acceso denegado por InfoExperto (HTTP ' . $httpCode . ')',
                'raw' => $response
            ]);
        }

        return $response;
    }
}
// --- FIN: Clase para InfoExperto ---

//Acceso Cors
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Origin, Content-Type, Accept, Authorization");

// Configuración de conexión a la base de datos
$host = 'localhost';
$user = 'root';
$password = '';
$database = 'leverSRL';

$conn = new mysqli($host, $user, $password, $database);

// Verificar conexión
if ($conn->connect_error) {
    die("Error de conexión a la base de datos: " . $conn->connect_error);
}

// Función para obtener datos de la base de datos
function getDatabaseData($query)
{
    global $conn;
    $result = $conn->query($query);

    if ($result->num_rows > 0) {
        $data = [];
        while ($row = $result->fetch_assoc()) {
            $data[] = $row;
        }
        return $data;
    } else {
        return [];
    }
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $datos = file_get_contents('php://input');
    $data = json_decode($datos, TRUE);

    $access_token = $data['accessToken'] ?? null;
    $categoria = $data['categoria'] ?? 'autos'; // autos, utilitarios, motos

    // --- INICIO: Integración InfoExperto ---
    if (isset($data['infoexperto'])) {
        $infoexperto = new InfoExperto();
        if (isset($data['cuit'])) {
            // Consulta por CUIT
            $cuit = $data['cuit'];
            $tipo = $data['tipo'] ?? 'normal';
            $result = $infoexperto->obtenerInformeCuit($cuit, $tipo);
            header('Content-Type: application/json');
            echo $result;
            die();
        } elseif (isset($data['dni'])) {
            // Consulta por DNI (sin sexo)
            $dni = $data['dni'];
            $tipo = $data['tipo'] ?? 'normal';
            $result = $infoexperto->obtenerInformeDni($dni, $tipo);
            header('Content-Type: application/json');
            echo $result;
            die();
        } else {
            echo json_encode(['status' => 'error', 'message' => 'Faltan parámetros para InfoExperto']);
            die();
        }
    }
    // --- FIN: Integración InfoExperto ---

    $a = new InfoAuto();
    $a->setApiType($categoria);

    if ($access_token == null) {
        $a->login();
        $access_token = $a->token;
    }

    if (json_last_error() === JSON_ERROR_NONE) {
        // Acceder a los datos
        $year = $data['year'] ?? '';
        $action = $data['action'] ?? '';
        $id = $data['idMarca'] ?? '';
        $codia = $data['codia'] ?? '';
        $features = $data['features'] ?? [];

        switch ($action) {
            case "getBrandsByYear":
                $a->getBrandsByYear($year, $access_token, $features);
                break;
            case "getModelsByBrand":
                $a->getModelsByBrand($id, $year, $access_token, $features);
                break;
            case "getPriceByCodia":
                $a->getPriceByCodia($codia, $year, $access_token);
                break;
            case "getFeaturesByCodia":
                $a->getFeaturesByCodia($codia, $access_token);
                break;
            case "getLtvAndMinAFinanciar":
                // Estas acciones ya no son necesarias
                die();
        }
    } else {
        // Manejar error de decodificación JSON
        echo "Error al decodificar los datos JSON.";
    }

    die();
}

// Manejar solicitudes GET para obtener precios usados
if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['endpoint'])) {
    $endpoint = $_GET['endpoint'];
    $url = "https://api.infoauto.com.ar/" . $endpoint;

    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Authorization: Bearer ' . $accessToken,
    ]);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    // Validar si la respuesta es JSON válida
    $data = json_decode($response, true);
    if (!is_array($data)) {
        echo json_encode([
            'accessToken' => $accessToken,
            'error' => 'Respuesta no válida del servidor InfoAuto',
            'raw' => $response
        ]);
        file_put_contents('log_response_infoauto.txt', $response); // Log para depuración
        exit;
    }

    if ($httpCode === 200) {
        // Validar si es una solicitud de motos
        if (str_contains($endpoint, 'motorcycles')) {
            echo json_encode([
                'accessToken' => $accessToken,
                'prices' => $data, // Array de precios por año
            ]);
        } else {
            // Manejar respuesta para autos
            if (isset($data['list_price'])) {
                echo json_encode([
                    'accessToken' => $accessToken,
                    'price' => $data['list_price'], // Usar el campo 'list_price' para autos
                ]);
            } else {
                echo json_encode([
                    'accessToken' => $accessToken,
                    'price' => 0, // Precio no encontrado
                ]);
            }
        }
    } else {
        echo json_encode(['error' => 'Error al consultar el servicio de Infoauto.']);
    }
    exit;
}

//codia activos: 630036, 630037, 630030, 630034

$conn->close();
