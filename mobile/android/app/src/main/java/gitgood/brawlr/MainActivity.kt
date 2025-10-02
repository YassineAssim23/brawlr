package gitgood.brawlr

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.compose.foundation.gestures.snapping.SnapPosition
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Slider
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.LocalLifecycleOwner
import androidx.compose.material.icons.filled.CameraFront
import androidx.compose.material.icons.filled.CameraRear
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Switch
import androidx.compose.material3.SwitchDefaults
import androidx.compose.ui.text.style.TextAlign
import gitgood.brawlr.ui.theme.Brawlr_appTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            Brawlr_appTheme {
                Scaffold(modifier = Modifier.fillMaxSize()) { innerPadding ->
                    BrawlrApp(modifier = Modifier.padding(innerPadding))
                }
            }
        }
    }
}

@Composable
fun BrawlrApp(modifier: Modifier){
//Theme for App
    val MainText = Color(0xFFFFFFFF)        // White
    val MainBackground = Color(0xFF0D0D0D)  // Dark background
    val RedAccent = Color(0xFFD50032)       // Accent red

    //Using Surface instead of Scaffold in this part of the app for the Material Theme aspect

    Surface (modifier = Modifier.fillMaxSize(), color = MainBackground)
    {
        Column(
            modifier = Modifier.padding(top = 50.dp)
        ) {
            Text(
                text = "brawlr.",
                color = MainText,
                fontSize = 35.sp,
                fontWeight = FontWeight.Bold,
                modifier = Modifier.align(Alignment.CenterHorizontally)
            )
            Spacer(modifier = Modifier.height(20.dp))


            //create a lifecycle for the current session of the app
            //https://developer.android.com/topic/libraries/architecture/compose
            val lifecycleOwner = LocalLifecycleOwner.current


            //Settings Card and Defaults
            var sessionTimer by remember { mutableStateOf(3f) } //default timer of 3 minutes
            var useFrontCamera by remember { mutableStateOf(false) }
            var isTraining by remember { mutableStateOf(false) }
            var cameraProviderState by remember { mutableStateOf<ProcessCameraProvider?>(null) }

            //Call Settings Card
            SettingsCard(
                sessionTimer = sessionTimer,
                onSessionChange = { sessionTimer = it },
                useFrontCamera = useFrontCamera,
                onToggleCamera = { useFrontCamera = it }
            )

            Spacer(modifier = Modifier.height(20.dp))

            //Start Training Button
            StartTraining(isTraining = isTraining)


            //Camera Area that Shows Preview
        }
    }
}

@Composable
fun SettingsCard(
    sessionTimer: Float,
    onSessionChange: (Float) -> Unit,
    useFrontCamera: Boolean,
    onToggleCamera: (Boolean) -> Unit
) {
    Column(modifier = Modifier.fillMaxWidth().padding(10.dp)) {

        // First Card (Session Time)
        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(8.dp),
            colors = CardDefaults.cardColors(containerColor = Color(0xFF1C1C1E))
        ) {
            Column(modifier = Modifier.padding(20.dp)) {
                Text(
                    text = "Session Time in Minutes:",
                    color = Color.White,
                    fontSize = 15.sp,
                    fontWeight = FontWeight.SemiBold
                )
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Slider(
                        value = sessionTimer,
                        onValueChange = { onSessionChange(it) },
                        valueRange = 1f..10f,
                        steps = 28,
                        modifier = Modifier.weight(1f)
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = sessionTimer.toString(),
                        color = Color.White,
                        fontWeight = FontWeight.SemiBold
                    )
                }
            }
        }

        // Divider OR Spacer for separation
        Spacer(modifier = Modifier.height(16.dp))
        // Divider(color = Color.Gray, thickness = 1.dp, modifier = Modifier.padding(horizontal = 10.dp))

        // Second Card (Camera Settings)
        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(8.dp),
            colors = CardDefaults.cardColors(containerColor = Color(0xFF1C1C1E))
        ) {
            Column(modifier = Modifier.padding(20.dp)) {
                Text(
                    text = "Camera:",
                    color = Color.White,
                    fontSize = 15.sp,
                    fontWeight = FontWeight.SemiBold
                )

                Spacer(modifier = Modifier.height(8.dp))

                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(
                            imageVector = if (useFrontCamera) Icons.Default.CameraFront else Icons.Default.CameraRear,
                            contentDescription = "Camera",
                            tint = Color(0xFFFFFFFF),
                            modifier = Modifier.size(32.dp)
                        )
                        Spacer(modifier = Modifier.width(2.dp))
                        Text(
                            if (useFrontCamera) "Front Camera" else "Back Camera",
                            color = Color.White,
                            fontWeight = FontWeight.SemiBold
                        )
                    }

                    Switch(
                        checked = useFrontCamera,
                        onCheckedChange = { onToggleCamera(it) },
                        colors = SwitchDefaults.colors(
                            checkedThumbColor = Color(0xFFD50032)
                        )
                    )
                }
            }
        }
    }
}

@Composable
fun StartTraining(
    isTraining: Boolean
){
    //Button for Start Training will be held in the card
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(8.dp),
        colors = CardDefaults.cardColors(containerColor = Color(0xFF1C1C1E))
    ){
        Button(
            onClick = { isTraining = !isTraining },
            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFD50032)),
            modifier = Modifier.fillMaxWidth()
                .height(56.dp),
            shape = RoundedCornerShape(8.dp)
        ){
            Text(
                text = if (!isTraining) "Start Training" else "Stop Training",
                color = Color.White,
                fontWeight = FontWeight.SemiBold,
                textAlign = TextAlign.Center,
                fontSize = 15.sp
            )
        }

    }
}

@Preview
@Composable
fun BrawlrPreview(){
    BrawlrApp(modifier = Modifier.fillMaxSize())
}