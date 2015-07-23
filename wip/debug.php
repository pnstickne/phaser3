<?php
    $file = '';

    if (isset($_GET['f']))
    {
        $file = $_GET['f'];
    }
?>
<!DOCTYPE HTML>
<html>
<head>
    <meta charset="UTF-8" />
    <title>Phaser 3 Test Runner</title>
    <style>
        body {
            font-family: sans-serif;
            font-size: 16px;
            margin: 16px;
        }

        a {
            text-decoration: none;
        }

        a:Hover {
            text-decoration: underline;
            color: red;
        }
    </style>
    <script src="lib/browser.js"></script>
    <script src="lib/system.js"></script>
</head>
<body>

    <h1 style="float: right; text-align: right">Phaser III<br />Test Runner</h1>

    <?php
        if ($file !== '')
        {
    ?>
    <script type="text/babel">

    System.baseURL = '../src/';
    System.transpiler = 'babel';

    System.import('../wip/<?php echo $file ?>').then(some_module => {

        //  party time

    })
    .catch(error => {
        console.log(error);
    });

    </script>
    <?php
        }
    ?>

    <ul>
    <?php
        $projects = scandir('.');

        $ignore = array('.', '..', '.git', 'node_modules', 'assets', 'dist', 'src');

        foreach ($projects as $key => $value) {

            if (!in_array($value, $ignore) && substr($value, -2) === 'js')
            {
                echo "<li><a href=\"debug.php?f=$value\">$value</a></li>";
            }
        }
    ?>
    </ul>

</body>
</html>