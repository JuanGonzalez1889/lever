<?php
function getAccessToken($apiType, $username, $password) {
    $url = "https://api.infoauto.com.ar/{$apiType}/auth/login";
    $headers = [
        "Content-Length: 0",
        "Content-type: application/json",
        "Authorization: Basic " . base64_encode($username . ":" . $password)
    ];
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_POST, 1);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    $response = curl_exec($ch);
    curl_close($ch);
    $tokens = json_decode($response, true);
    return $tokens['access_token'] ?? null;
}

function getBrands($apiType, $accessToken) {
    $year = date('Y');
    $url = "https://api.infoauto.com.ar/{$apiType}/pub/brands/?query_mode=matching&list_price=true&page=1&page_size=100";
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Authorization: Bearer ' . $accessToken
    ]);
    $response = curl_exec($ch);
    curl_close($ch);
    return json_decode($response, true);
}

function printBrandsWithoutLogo($brands, $tipo) {
    foreach ($brands as $brand) {
        $logo = $brand['logo_url'] ?? $brand['logo'] ?? null;
        if (empty($logo)) {
            echo "[{$tipo}] " . $brand['name'] . " (ID: " . $brand['id'] . ")\n";
        }
    }
}

// --- AUTOS ---
echo "Marcas de AUTOS sin logo:\n";
$tokenAutos = getAccessToken('cars', 'alejandro.amado@lever.com.ar', 'tFz2SRHrrSkNAzBZ');
$brandsAutos = getBrands('cars', $tokenAutos);
printBrandsWithoutLogo($brandsAutos, 'AUTO');

echo "\nMarcas de MOTOS sin logo:\n";
$tokenMotos = getAccessToken('motorcycles', 'alejandro.amado@lever.com.ar', 'a2tyKwLEGUaucurp');
$brandsMotos = getBrands('motorcycles', $tokenMotos);
printBrandsWithoutLogo($brandsMotos, 'MOTO');
