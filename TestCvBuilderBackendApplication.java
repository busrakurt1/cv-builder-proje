package com.cvbuilder;

import org.springframework.boot.SpringApplication;

public class TestCvBuilderBackendApplication {

	public static void main(String[] args) {
		SpringApplication.from(CvBuilderBackendApplication::main).with(TestcontainersConfiguration.class).run(args);
	}

}
